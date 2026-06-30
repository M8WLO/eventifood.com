"""
Eventifood external health monitor.
Runs as a GitHub Actions job on a cron schedule.
Completely independent of Railway infrastructure.
"""

import os
import time
import datetime
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests

RAILWAY_API = 'https://backboard.railway.app/graphql/v2'

SERVICE_IDS = {
    'backend':  'b64684a0-6243-4282-97e8-175658cadd18',
    'frontend': '2b53c16f-c6ec-4e79-abc4-0241aa77e372',
    'postgres': '2aca4d59-ab31-46d1-adbc-9a46380ed4be',
}

METRIC_MEASUREMENTS = ['CPU_USAGE', 'MEMORY_USAGE_GB', 'NETWORK_TX_BYTES', 'NETWORK_RX_BYTES']


def _gql(token, query, variables=None):
    resp = requests.post(
        RAILWAY_API,
        json={'query': query, 'variables': variables or {}},
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def check_url(url, expected_status=200):
    start = time.monotonic()
    try:
        r = requests.get(url, timeout=10, allow_redirects=True)
        ms = int((time.monotonic() - start) * 1000)
        return {'ok': r.status_code == expected_status, 'status': r.status_code, 'ms': ms, 'error': None}
    except Exception as exc:
        ms = int((time.monotonic() - start) * 1000)
        return {'ok': False, 'status': None, 'ms': ms, 'error': str(exc)[:120]}


def get_deployments(token, project_id):
    query = """
    query($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              id
              name
              serviceInstances {
                edges {
                  node {
                    latestDeployment { id status createdAt }
                  }
                }
              }
            }
          }
        }
      }
    }
    """
    try:
        data = _gql(token, query, {'projectId': project_id})
        result = {}
        for edge in data['data']['project']['services']['edges']:
            svc = edge['node']
            instances = svc['serviceInstances']['edges']
            if instances:
                dep = instances[0]['node'].get('latestDeployment') or {}
                result[svc['name']] = {
                    'status': dep.get('status', 'UNKNOWN'),
                    'deployed_at': dep.get('createdAt', ''),
                }
        return result, None
    except Exception as exc:
        return {}, str(exc)


def get_metrics(token, project_id, environment_id, service_id):
    now = datetime.datetime.utcnow()
    start = (now - datetime.timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%SZ')
    end = now.strftime('%Y-%m-%dT%H:%M:%SZ')
    query = """
    query($projectId: String!, $environmentId: String!, $serviceId: String!,
          $startDate: DateTime!, $endDate: DateTime!, $measurements: [MetricMeasurement!]!) {
      metrics(
        projectId: $projectId environmentId: $environmentId serviceId: $serviceId
        startDate: $startDate endDate: $endDate measurements: $measurements
      ) { measurement values { ts value } }
    }
    """
    try:
        data = _gql(token, query, {
            'projectId': project_id, 'environmentId': environment_id, 'serviceId': service_id,
            'startDate': start, 'endDate': end, 'measurements': METRIC_MEASUREMENTS,
        })
        result = {}
        for m in (data.get('data', {}).get('metrics') or []):
            values = [v['value'] for v in m.get('values', []) if v.get('value') is not None]
            if values:
                result[m['measurement']] = {'avg': sum(values)/len(values), 'max': max(values)}
        return result
    except Exception:
        return {}


def fmt_bytes(val):
    if val is None:
        return '—'
    mb = val / (1024 * 1024)
    return f'{mb/1024:.2f} GB' if mb >= 1000 else f'{mb:.1f} MB'


def deploy_badge(status):
    return {
        'SUCCESS': '✅ SUCCESS', 'DEPLOYING': '🔄 DEPLOYING',
        'FAILED': '❌ FAILED', 'CRASHED': '💥 CRASHED',
        'SLEEPING': '😴 SLEEPING',
    }.get(status, f'❓ {status}')


def build_html(checks, deployments, deploy_error, metrics_by_service, now_str, subject_prefix):
    all_ok = all(c['result']['ok'] for c in checks)
    hdr_colour = '#16a34a' if all_ok else '#dc2626'
    summary = 'All systems operational' if all_ok else 'One or more services degraded'

    ts = 'width:100%;border-collapse:collapse;font-size:14px;'
    th = 'padding:10px 12px;text-align:left;background:#f3f4f6;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;'

    check_rows = ''
    for c in checks:
        r = c['result']
        icon = '✅' if r['ok'] else '❌'
        ms_col = '#16a34a' if r['ms'] < 500 else ('#f59e0b' if r['ms'] < 1500 else '#dc2626')
        stat = str(r['status']) if r['status'] else f'ERROR: {r["error"]}'
        check_rows += f'<tr><td style="padding:10px 12px;font-weight:600;">{icon} {c["name"]}</td><td style="padding:10px 12px;">{c["url"]}</td><td style="padding:10px 12px;color:{"#16a34a" if r["ok"] else "#dc2626"};">{stat}</td><td style="padding:10px 12px;color:{ms_col};font-family:monospace;">{r["ms"]} ms</td></tr>'

    deploy_rows = f'<tr><td colspan="3" style="padding:10px;color:#dc2626;">Railway API error: {deploy_error}</td></tr>' if deploy_error else ''
    for name, info in (deployments or {}).items():
        badge = deploy_badge(info['status'])
        ts_str = info['deployed_at'][:19].replace('T', ' ') + ' UTC' if info['deployed_at'] else '—'
        deploy_rows += f'<tr><td style="padding:10px 12px;font-weight:600;">{name}</td><td style="padding:10px 12px;">{badge}</td><td style="padding:10px 12px;font-size:12px;color:#6b7280;">{ts_str}</td></tr>'

    metric_rows = ''
    for label, m in (metrics_by_service or {}).items():
        if not m:
            continue
        cpu = m.get('CPU_USAGE', {})
        mem = m.get('MEMORY_USAGE_GB', {})
        net_tx = m.get('NETWORK_TX_BYTES', {})
        cpu_str = f"{cpu.get('avg',0)*100:.2f}% avg / {cpu.get('max',0)*100:.2f}% peak" if cpu else '—'
        mem_str = f"{mem.get('avg',0):.3f} GB avg / {mem.get('max',0):.3f} GB peak" if mem else '—'
        tx_str = fmt_bytes(net_tx.get('avg')) if net_tx else '—'
        metric_rows += f'''
        <tr style="background:#f9fafb;"><td colspan="2" style="padding:10px 12px;font-weight:700;font-size:13px;">{label}</td></tr>
        <tr><td style="padding:6px 12px 6px 20px;color:#6b7280;">CPU</td><td style="padding:6px 12px;font-family:monospace;font-size:13px;">{cpu_str}</td></tr>
        <tr><td style="padding:6px 12px 6px 20px;color:#6b7280;">Memory</td><td style="padding:6px 12px;font-family:monospace;font-size:13px;">{mem_str}</td></tr>
        <tr><td style="padding:6px 12px 6px 20px;color:#6b7280;">Network TX avg/hr</td><td style="padding:6px 12px;font-family:monospace;font-size:13px;">{tx_str}</td></tr>'''

    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>{subject_prefix}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 16px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">

<tr><td style="background:{hdr_colour};border-radius:12px 12px 0 0;padding:24px 28px;">
  <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">{subject_prefix}</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:14px;">{summary} · {now_str} UTC · monitored externally via GitHub Actions</p>
</td></tr>

<tr><td style="background:#fff;padding:20px 28px;">
  <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111;">HTTP Health Checks</h2>
  <table style="{ts}">
    <tr><th style="{th}">Service</th><th style="{th}">URL</th><th style="{th}">Status</th><th style="{th}">Response</th></tr>
    {check_rows}
  </table>
</td></tr>

<tr><td style="background:#fff;padding:0 28px 20px;border-top:1px solid #f0f0f0;">
  <h2 style="margin:16px 0 12px;font-size:15px;font-weight:700;color:#111;">Railway Deployment Status</h2>
  <table style="{ts}">
    <tr><th style="{th}">Service</th><th style="{th}">Status</th><th style="{th}">Last deployed</th></tr>
    {deploy_rows or '<tr><td colspan="3" style="padding:10px;color:#6b7280;">No deployment data</td></tr>'}
  </table>
</td></tr>

<tr><td style="background:#fff;padding:0 28px 24px;border-top:1px solid #f0f0f0;">
  <h2 style="margin:16px 0 12px;font-size:15px;font-weight:700;color:#111;">Performance Metrics (last hour)</h2>
  <table style="{ts}">
    {metric_rows or '<tr><td colspan="2" style="padding:10px;color:#6b7280;">Metrics unavailable</td></tr>'}
  </table>
</td></tr>

<tr><td style="background:#f9fafb;border-radius:0 0 12px 12px;padding:14px 28px;border-top:1px solid #e5e7eb;">
  <p style="margin:0;font-size:12px;color:#9ca3af;">External health monitor · github.com/M8WLO/eventifood.com · Runs every hour</p>
</td></tr>

</table></td></tr></table></body></html>"""


def send_email(recipients, subject, html_body, plain_body):
    host = os.environ['SMTP_HOST']
    port = int(os.environ.get('SMTP_PORT', '587'))
    user = os.environ['SMTP_USER']
    password = os.environ['SMTP_PASSWORD']
    from_addr = os.environ.get('FROM_EMAIL', user)

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = ', '.join(recipients)
    msg.attach(MIMEText(plain_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))

    ctx = ssl.create_default_context()
    with smtplib.SMTP(host, port) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ctx)
        smtp.login(user, password)
        smtp.sendmail(from_addr, recipients, msg.as_string())


def main():
    now_str = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')

    frontend_url = os.environ.get('FRONTEND_URL', 'https://eventifood.com')
    backend_url = os.environ.get('BACKEND_URL', 'https://backend-production-9e5c.up.railway.app')
    railway_token = os.environ.get('RAILWAY_API_TOKEN', '')
    project_id = os.environ.get('RAILWAY_PROJECT_ID', 'd7f20f14-393c-4f13-9d62-629552dabe04')
    environment_id = os.environ.get('RAILWAY_ENVIRONMENT_ID', '5018b358-536e-4115-850d-5088708468c0')

    raw_emails = os.environ.get('HEALTH_CHECK_EMAILS', 'filemakers@gmail.com')
    recipients = [e.strip() for e in raw_emails.split(',') if e.strip()]
    subject_prefix = os.environ.get('HEALTH_CHECK_SUBJECT', 'Eventifood Health Report')

    # HTTP checks
    checks = [
        {'name': 'Frontend',    'url': frontend_url,              'result': check_url(frontend_url)},
        {'name': 'Backend API', 'url': f'{backend_url}/api/health/', 'result': check_url(f'{backend_url}/api/health/')},
    ]

    # Railway deployment status
    deployments, deploy_error = {}, None
    if railway_token:
        deployments, deploy_error = get_deployments(railway_token, project_id)
    else:
        deploy_error = 'RAILWAY_API_TOKEN secret not configured'

    # Railway metrics
    metrics_by_service = {}
    if railway_token:
        for label, svc_id in [('Backend', SERVICE_IDS['backend']), ('Frontend', SERVICE_IDS['frontend'])]:
            m = get_metrics(railway_token, project_id, environment_id, svc_id)
            if m:
                metrics_by_service[label] = m

    all_ok = all(c['result']['ok'] for c in checks)
    status_icon = '✅' if all_ok else '❌'
    subject = f'{status_icon} {subject_prefix} — {now_str} UTC'

    html = build_html(checks, deployments, deploy_error, metrics_by_service, now_str, subject_prefix)
    plain = '\n'.join(f"{c['name']}: {'OK' if c['result']['ok'] else 'DOWN'} {c['result']['ms']}ms" for c in checks)

    if not recipients:
        print('No recipients configured — HEALTH_CHECK_EMAILS secret is empty')
        return

    send_email(recipients, subject, html, plain)
    print(f'Health report sent to {", ".join(recipients)}')

    # Exit non-zero if any service is down so GitHub marks the run as failed (red)
    if not all_ok:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
