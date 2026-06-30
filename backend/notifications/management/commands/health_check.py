"""
Hourly health check — runs as a Railway Cron job.
Checks frontend + backend HTTP health, pulls Railway deployment status and
CPU/memory metrics, then emails a summary to the configured HEALTH_CHECK_EMAIL.

Railway cron command:  python manage.py health_check
Schedule:              0 * * * *

Required env vars (set on the cron service):
    RAILWAY_API_TOKEN     — Railway account token (not project token)
    RAILWAY_PROJECT_ID    — d7f20f14-393c-4f13-9d62-629552dabe04
    RAILWAY_ENVIRONMENT_ID — 5018b358-536e-4115-850d-5088708468c0
    HEALTH_CHECK_EMAIL    — recipient address (e.g. filemakers@gmail.com)
    FRONTEND_URL          — https://eventifood.com
    BACKEND_URL           — https://backend-production-9e5c.up.railway.app
    DATABASE_URL          — (inherited, used to test DB connectivity)
    EMAIL_*               — (inherited SMTP settings)
"""

import time
import datetime
from decouple import config

import requests
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.db import connection, OperationalError

RAILWAY_API = 'https://backboard.railway.app/graphql/v2'

SERVICE_IDS = {
    'frontend': '2b53c16f-c6ec-4e79-abc4-0241aa77e372',
    'backend':  'b64684a0-6243-4282-97e8-175658cadd18',
    'postgres': '3eefbab7-553d-4151-85b4-ce57e305d911',
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


def _check_url(url, expected_status=200):
    start = time.monotonic()
    try:
        r = requests.get(url, timeout=10, allow_redirects=True)
        ms = int((time.monotonic() - start) * 1000)
        ok = r.status_code == expected_status
        return {'ok': ok, 'status': r.status_code, 'ms': ms, 'error': None}
    except Exception as exc:
        ms = int((time.monotonic() - start) * 1000)
        return {'ok': False, 'status': None, 'ms': ms, 'error': str(exc)}


def _check_db():
    try:
        with connection.cursor() as cur:
            cur.execute('SELECT 1')
        return {'ok': True, 'error': None}
    except OperationalError as exc:
        return {'ok': False, 'error': str(exc)}


def _get_deployments(token, project_id):
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
                    latestDeployment {
                      id
                      status
                      createdAt
                    }
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
            name = svc['name']
            instances = svc['serviceInstances']['edges']
            if instances:
                dep = instances[0]['node'].get('latestDeployment') or {}
                result[name] = {
                    'status': dep.get('status', 'UNKNOWN'),
                    'deployed_at': dep.get('createdAt', ''),
                }
            else:
                result[name] = {'status': 'NO_INSTANCE', 'deployed_at': ''}
        return result, None
    except Exception as exc:
        return {}, str(exc)


def _get_metrics(token, project_id, environment_id, service_id, service_name):
    now = datetime.datetime.utcnow()
    start = (now - datetime.timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%SZ')
    end = now.strftime('%Y-%m-%dT%H:%M:%SZ')

    query = """
    query($projectId: String!, $environmentId: String!, $serviceId: String!,
          $startDate: DateTime!, $endDate: DateTime!, $measurements: [MetricMeasurement!]!) {
      metrics(
        projectId: $projectId
        environmentId: $environmentId
        serviceId: $serviceId
        startDate: $startDate
        endDate: $endDate
        measurements: $measurements
      ) {
        measurement
        values {
          ts
          value
        }
      }
    }
    """
    try:
        data = _gql(token, query, {
            'projectId': project_id,
            'environmentId': environment_id,
            'serviceId': service_id,
            'startDate': start,
            'endDate': end,
            'measurements': METRIC_MEASUREMENTS,
        })
        metrics = data.get('data', {}).get('metrics', []) or []
        result = {}
        for m in metrics:
            values = [v['value'] for v in m.get('values', []) if v.get('value') is not None]
            if values:
                result[m['measurement']] = {
                    'avg': sum(values) / len(values),
                    'max': max(values),
                    'latest': values[-1],
                }
        return result, None
    except Exception as exc:
        return {}, str(exc)


def _status_badge(ok):
    return '✅' if ok else '❌'


def _deploy_badge(status):
    badges = {
        'SUCCESS': '✅ SUCCESS',
        'DEPLOYING': '🔄 DEPLOYING',
        'FAILED': '❌ FAILED',
        'CRASHED': '💥 CRASHED',
        'SLEEPING': '😴 SLEEPING',
        'REMOVED': '🗑 REMOVED',
    }
    return badges.get(status, f'❓ {status}')


def _fmt_metric(val, unit=''):
    if val is None:
        return '—'
    if isinstance(val, float):
        return f'{val:.3f}{unit}'
    return f'{val}{unit}'


def _fmt_bytes(val_bytes):
    if val_bytes is None:
        return '—'
    mb = val_bytes / (1024 * 1024)
    if mb >= 1000:
        return f'{mb/1024:.2f} GB'
    return f'{mb:.1f} MB'


def _build_html(checks, deployments, deploy_error, metrics_by_service, now_str):
    all_ok = all(c['result']['ok'] for c in checks)
    summary_colour = '#16a34a' if all_ok else '#dc2626'
    summary_text = 'All systems operational' if all_ok else 'One or more services degraded'

    rows = ''
    for c in checks:
        r = c['result']
        icon = _status_badge(r['ok'])
        ms_color = '#16a34a' if r['ms'] < 500 else ('#f59e0b' if r['ms'] < 1500 else '#dc2626')
        status_text = str(r['status']) if r['status'] else f'ERROR: {r["error"]}'
        rows += f"""
        <tr>
          <td style="padding:10px 12px;font-weight:600;">{icon} {c['name']}</td>
          <td style="padding:10px 12px;">{c['url']}</td>
          <td style="padding:10px 12px;color:{'#16a34a' if r['ok'] else '#dc2626'};">{status_text}</td>
          <td style="padding:10px 12px;color:{ms_color};font-family:monospace;">{r['ms']} ms</td>
        </tr>"""

    deploy_rows = ''
    if deploy_error:
        deploy_rows = f'<tr><td colspan="3" style="padding:10px;color:#dc2626;">Railway API error: {deploy_error}</td></tr>'
    else:
        for svc_name, info in deployments.items():
            badge = _deploy_badge(info['status'])
            deployed_at = info['deployed_at'][:19].replace('T', ' ') if info['deployed_at'] else '—'
            deploy_rows += f"""
            <tr>
              <td style="padding:10px 12px;font-weight:600;">{svc_name}</td>
              <td style="padding:10px 12px;">{badge}</td>
              <td style="padding:10px 12px;font-size:12px;color:#6b7280;">{deployed_at} UTC</td>
            </tr>"""

    metric_sections = ''
    for svc_label, m in metrics_by_service.items():
        if not m:
            continue
        cpu = m.get('CPU_USAGE', {})
        mem = m.get('MEMORY_USAGE_GB', {})
        net_tx = m.get('NETWORK_TX_BYTES', {})
        net_rx = m.get('NETWORK_RX_BYTES', {})
        cpu_pct = f"{cpu.get('avg', 0)*100:.2f}% avg / {cpu.get('max', 0)*100:.2f}% peak" if cpu else '—'
        mem_gb = f"{mem.get('avg', 0):.3f} GB avg / {mem.get('max', 0):.3f} GB peak" if mem else '—'
        tx = _fmt_bytes(net_tx.get('avg')) if net_tx else '—'
        rx = _fmt_bytes(net_rx.get('avg')) if net_rx else '—'
        metric_sections += f"""
        <tr style="background:#f9fafb;">
          <td colspan="2" style="padding:10px 12px;font-weight:700;font-size:13px;color:#374151;">{svc_label}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 20px;color:#6b7280;">CPU</td>
          <td style="padding:6px 12px;font-family:monospace;font-size:13px;">{cpu_pct}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 20px;color:#6b7280;">Memory</td>
          <td style="padding:6px 12px;font-family:monospace;font-size:13px;">{mem_gb}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 20px;color:#6b7280;">Network TX (avg/hr)</td>
          <td style="padding:6px 12px;font-family:monospace;font-size:13px;">{tx}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 20px;color:#6b7280;">Network RX (avg/hr)</td>
          <td style="padding:6px 12px;font-family:monospace;font-size:13px;">{rx}</td>
        </tr>"""

    table_style = 'width:100%;border-collapse:collapse;font-size:14px;'
    th_style = 'padding:10px 12px;text-align:left;background:#f3f4f6;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;'

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Eventifood Health Report</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 16px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">

    <!-- Header -->
    <tr><td style="background:{summary_colour};border-radius:12px 12px 0 0;padding:24px 28px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">Eventifood Platform Health</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">{summary_text} · {now_str} UTC</p>
    </td></tr>

    <!-- HTTP Checks -->
    <tr><td style="background:#fff;padding:20px 28px;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111;">HTTP Health Checks</h2>
      <table style="{table_style}">
        <tr>
          <th style="{th_style}">Service</th>
          <th style="{th_style}">URL</th>
          <th style="{th_style}">HTTP Status</th>
          <th style="{th_style}">Response time</th>
        </tr>
        {rows}
      </table>
    </td></tr>

    <!-- Deployments -->
    <tr><td style="background:#fff;padding:0 28px 20px;border-top:1px solid #f0f0f0;">
      <h2 style="margin:16px 0 12px;font-size:15px;font-weight:700;color:#111;">Railway Deployment Status</h2>
      <table style="{table_style}">
        <tr>
          <th style="{th_style}">Service</th>
          <th style="{th_style}">Status</th>
          <th style="{th_style}">Last deployed</th>
        </tr>
        {deploy_rows}
      </table>
    </td></tr>

    <!-- Metrics -->
    <tr><td style="background:#fff;padding:0 28px 24px;border-top:1px solid #f0f0f0;">
      <h2 style="margin:16px 0 12px;font-size:15px;font-weight:700;color:#111;">Performance Metrics (last hour)</h2>
      <table style="{table_style}">
        {metric_sections if metric_sections else '<tr><td colspan="2" style="padding:10px;color:#6b7280;">Metrics unavailable</td></tr>'}
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#f9fafb;border-radius:0 0 12px 12px;padding:14px 28px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Automated health report · Eventifood · Runs every hour</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>"""


class Command(BaseCommand):
    help = 'Check all Eventifood services and email a health report'

    def handle(self, *args, **options):
        now_str = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')

        from accounts.models import PlatformConfig
        platform_config = PlatformConfig.get()

        railway_token = config('RAILWAY_API_TOKEN', default='')
        project_id = config('RAILWAY_PROJECT_ID', default='d7f20f14-393c-4f13-9d62-629552dabe04')
        environment_id = config('RAILWAY_ENVIRONMENT_ID', default='5018b358-536e-4115-850d-5088708468c0')
        frontend_url = config('FRONTEND_URL', default='https://eventifood.com')
        backend_url = config('BACKEND_URL', default='https://backend-production-9e5c.up.railway.app')

        recipients = platform_config.get_health_check_email_list()
        subject_prefix = platform_config.health_check_subject or 'Eventifood Health Report'

        # ── HTTP checks ──────────────────────────────────────────────────────
        checks = [
            {
                'name': 'Frontend',
                'url': frontend_url,
                'result': _check_url(frontend_url),
            },
            {
                'name': 'Backend API',
                'url': f'{backend_url}/api/health/',
                'result': _check_url(f'{backend_url}/api/health/'),
            },
            {
                'name': 'Database',
                'url': '(internal)',
                'result': {**_check_db(), 'ms': 0, 'status': 'OK' if _check_db()['ok'] else 'FAIL'},
            },
        ]

        # ── Railway deployment status ────────────────────────────────────────
        deployments, deploy_error = {}, None
        if railway_token:
            deployments, deploy_error = _get_deployments(railway_token, project_id)
        else:
            deploy_error = 'RAILWAY_API_TOKEN not set'

        # ── Railway metrics (backend + frontend) ────────────────────────────
        metrics_by_service = {}
        if railway_token:
            for label, svc_id in [('Backend', SERVICE_IDS['backend']), ('Frontend', SERVICE_IDS['frontend'])]:
                m, _ = _get_metrics(railway_token, project_id, environment_id, svc_id, label)
                if m:
                    metrics_by_service[label] = m

        # ── Build and send email ─────────────────────────────────────────────
        all_ok = all(c['result']['ok'] for c in checks)
        status_icon = '✅' if all_ok else '❌'
        subject = f'{status_icon} {subject_prefix} — {now_str} UTC'

        html = _build_html(checks, deployments, deploy_error, metrics_by_service, now_str)

        plain = '\n'.join(
            f"{c['name']}: {'OK' if c['result']['ok'] else 'DOWN'} — {c['result']['ms']}ms"
            for c in checks
        )

        if not recipients:
            self.stdout.write(self.style.WARNING('No health check emails configured — skipping send'))
            return

        send_mail(
            subject=subject,
            message=plain,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            html_message=html,
            fail_silently=False,
        )
        self.stdout.write(self.style.SUCCESS(f'Health report sent to {", ".join(recipients)}'))
