'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'

interface TenantRow {
  slug: string
  name: string
  is_active: boolean
  created_at: string
  owner_email: string | null
  owner_name: string | null
  subscription_status: string | null
  subscription_plan: string | null
  order_count: number
}

interface PlatformStats {
  today: number
  this_week: number
  this_year: number
  all_time: number
}

interface PlatformConfig {
  mfa_required: boolean
  sandbox_mode: boolean
  updated_at: string
}

const ALL_FLAGS = [
  { key: 'print_menus', label: 'Print menus',          hint: 'Sellers can generate printable menu PDFs' },
  { key: 'inventory',   label: 'Inventory management', hint: 'Stock level tracking per product' },
  { key: 'wastage',     label: 'Wastage tracking',     hint: 'Log and report on product waste' },
  { key: 'analytics',   label: 'Sales analytics & P&L',hint: 'Revenue, cost, and profit dashboards' },
  { key: 'events',      label: 'Events',               hint: 'Event-specific pricing presets' },
  { key: 'discounts',   label: 'Discounts',            hint: 'Discount codes and promotional pricing' },
  { key: 'wait_time',   label: 'Live wait time',       hint: 'Show estimated wait banner to customers' },
  { key: 'staff',       label: 'Staff cost tracking',  hint: 'Log staff hours and costs against revenue' },
  { key: 'sms',         label: 'SMS notifications',    hint: 'Send SMS alerts to customers on order ready' },
]

const SUB_BADGE: Record<string, string> = {
  active:    'bg-green-50 text-green-700',
  trialing:  'bg-blue-50 text-blue-700',
  past_due:  'bg-red-50 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function SuperAdminPage() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') === 'tenants' ? 'tenants' : 'platform'

  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [reseqMsg, setReseqMsg] = useState('')
  const [reseqRunning, setReseqRunning] = useState(false)
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null)
  const [mfaSaving, setMfaSaving] = useState(false)
  const [featureOverrides, setFeatureOverrides] = useState<Record<string, boolean>>({})
  const [featureOverrideSaving, setFeatureOverrideSaving] = useState(false)
  const [copyFrom, setCopyFrom] = useState('')
  const [copyTo, setCopyTo] = useState('')
  const [copyOrders, setCopyOrders] = useState(false)
  const [copyRunning, setCopyRunning] = useState(false)
  const [copyResult, setCopyResult] = useState<string | null>(null)
  const [orphanedUsers, setOrphanedUsers] = useState<{id: number, email: string, full_name: string, email_verified: boolean, date_joined: string}[]>([])
  const [orphanDeleting, setOrphanDeleting] = useState<number | null>(null)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleteUserMsg, setDeleteUserMsg] = useState<string | null>(null)
  const [deleteUserRunning, setDeleteUserRunning] = useState(false)
  const [sandboxSaving, setSandboxSaving] = useState(false)

  const resequenceAll = async () => {
    if (!confirm('Resequence daily order numbers across all tenants? This fixes any duplicate #0001s for the last 18 hours of orders.')) return
    setReseqRunning(true)
    try {
      const r = await api.post('/api/orders/admin/resequence-all/')
      const total = r.data.total
      setReseqMsg(`Done — resequenced ${total} orders across ${r.data.tenants.length} tenants.`)
    } catch {
      setReseqMsg('Resequence failed — check backend logs.')
    } finally {
      setReseqRunning(false)
      setTimeout(() => setReseqMsg(''), 6000)
    }
  }

  const toggleFeatureOverride = async (flag: string, value: boolean) => {
    const updated = { ...featureOverrides, [flag]: value }
    setFeatureOverrides(updated)
    setFeatureOverrideSaving(true)
    try {
      const r = await api.patch('/api/subscriptions/platform-features/', { [flag]: value })
      setFeatureOverrides(r.data)
    } finally {
      setFeatureOverrideSaving(false)
    }
  }

  const deleteUserByEmail = async () => {
    if (!deleteEmail) return
    if (!confirm(`Permanently delete user account for ${deleteEmail}? This cannot be undone.`)) return
    setDeleteUserRunning(true)
    setDeleteUserMsg(null)
    try {
      const r = await api.delete('/api/auth/admin/orphaned-users/', { data: { email: deleteEmail } })
      setDeleteUserMsg(r.data.detail)
      setDeleteEmail('')
      api.get('/api/auth/admin/orphaned-users/').then(r => setOrphanedUsers(r.data)).catch(() => {})
    } catch (e: any) {
      setDeleteUserMsg(`Error: ${e?.response?.data?.detail || 'Failed'}`)
    } finally {
      setDeleteUserRunning(false)
      setTimeout(() => setDeleteUserMsg(null), 6000)
    }
  }

  const deleteOrphan = async (userId: number) => {
    if (!confirm('Delete this user permanently?')) return
    setOrphanDeleting(userId)
    try {
      await api.delete('/api/auth/admin/orphaned-users/', { data: { user_id: userId } })
      setOrphanedUsers(prev => prev.filter(u => u.id !== userId))
    } finally {
      setOrphanDeleting(null)
    }
  }

  const copyTenant = async () => {
    if (!copyFrom || !copyTo) return
    const ordersNote = copyOrders ? ', and historical orders (includes customer names/emails/phones)' : ''
    if (!confirm(`Copy catalog, settings${ordersNote} from ${copyFrom} → ${copyTo}? This will overwrite the destination.`)) return
    setCopyRunning(true)
    setCopyResult(null)
    try {
      const r = await api.post('/api/tenants/admin/copy/', { from_email: copyFrom, to_email: copyTo, copy_orders: copyOrders })
      const s = r.data.stats
      const ordersPart = copyOrders ? `, ${s.orders} orders` : ''
      setCopyResult(`Done: ${s.categories} categories, ${s.products} products, ${s.variations} variations${ordersPart} copied.`)
    } catch (e: any) {
      setCopyResult(`Error: ${e?.response?.data?.detail || 'Copy failed — check backend logs.'}`)
    } finally {
      setCopyRunning(false)
    }
  }

  const toggleMfa = async (value: boolean) => {
    setMfaSaving(true)
    try {
      const r = await api.patch('/api/auth/admin/platform-config/', { mfa_required: value })
      setPlatformConfig(r.data)
    } finally {
      setMfaSaving(false)
    }
  }

  const toggleSandbox = async (value: boolean) => {
    if (value && !confirm('Enable payment sandbox mode? All payment providers will use test/sandbox credentials. Do NOT enable this on production with real sellers.')) return
    setSandboxSaving(true)
    try {
      const r = await api.patch('/api/auth/admin/platform-config/', { sandbox_mode: value })
      setPlatformConfig(r.data)
    } finally {
      setSandboxSaving(false)
    }
  }

  useEffect(() => {
    api.get('/api/tenants/admin/')
      .then((r) => setTenants(r.data))
      .finally(() => setLoading(false))
    api.get('/api/orders/platform/stats/')
      .then((r) => setStats(r.data))
      .catch(() => {})
    api.get('/api/auth/admin/platform-config/')
      .then((r) => setPlatformConfig(r.data))
      .catch(() => {})
    api.get('/api/subscriptions/platform-features/')
      .then((r) => setFeatureOverrides(r.data))
      .catch(() => {})
    api.get('/api/auth/admin/orphaned-users/')
      .then((r) => setOrphanedUsers(r.data))
      .catch(() => {})
  }, [])

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.owner_email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform admin</h1>

      {/* Sandbox warning banner */}
      {platformConfig?.sandbox_mode && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <div>
            <p className="font-bold text-amber-900 text-sm">Payment sandbox mode is ON</p>
            <p className="text-xs text-amber-700 mt-0.5">All payment providers are using test credentials. No real money is moving. Turn this off before going live.</p>
          </div>
        </div>
      )}

      {/* ── Platform settings tab ── */}
      {tab === 'platform' && (
        <div className="space-y-8">
          {/* Auth & payment toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-800">Email MFA</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {platformConfig?.mfa_required
                      ? 'All users must verify with an emailed code on every login.'
                      : 'MFA is disabled — users log in with password only.'}
                  </p>
                </div>
                <button
                  onClick={() => platformConfig && toggleMfa(!platformConfig.mfa_required)}
                  disabled={mfaSaving || !platformConfig}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    platformConfig?.mfa_required ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    platformConfig?.mfa_required ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              {platformConfig && (
                <p className="text-xs text-gray-400 mt-3">
                  Status: <span className={`font-medium ${platformConfig.mfa_required ? 'text-green-600' : 'text-orange-500'}`}>
                    {platformConfig.mfa_required ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
              )}
            </div>

            <div className={`card border-2 ${platformConfig?.sandbox_mode ? 'border-amber-400 bg-amber-50' : 'border-transparent'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className={`font-semibold ${platformConfig?.sandbox_mode ? 'text-amber-900' : 'text-gray-800'}`}>
                    🧪 Payment sandbox mode
                  </h2>
                  <p className={`text-sm mt-0.5 ${platformConfig?.sandbox_mode ? 'text-amber-700' : 'text-gray-500'}`}>
                    {platformConfig?.sandbox_mode
                      ? 'ACTIVE — Stripe, PayPal, GoCardless all using test credentials.'
                      : 'Routes all payment providers to their sandbox/test environments.'}
                  </p>
                </div>
                <button
                  onClick={() => platformConfig && toggleSandbox(!platformConfig.sandbox_mode)}
                  disabled={sandboxSaving || !platformConfig}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    platformConfig?.sandbox_mode ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    platformConfig?.sandbox_mode ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Status: <span className={`font-medium ${platformConfig?.sandbox_mode ? 'text-amber-600' : 'text-gray-500'}`}>
                  {platformConfig?.sandbox_mode ? 'Sandbox (test mode)' : 'Live'}
                </span>
              </p>
            </div>
          </div>

          {/* Feature overrides */}
          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Enable for all tenants</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Tick any feature to unlock it for every tenant regardless of their plan — useful for platform-wide trials.
                {featureOverrideSaving && <span className="ml-2 text-brand-500 font-medium">Saving…</span>}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {ALL_FLAGS.map((f) => (
                <label key={f.key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!featureOverrides[f.key]}
                    onChange={(e) => toggleFeatureOverride(f.key, e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-brand-600 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{f.label}</p>
                    <p className="text-xs text-gray-400">{f.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Platform order stats */}
          <div>
            <h2 className="text-base font-semibold text-gray-600 mb-3">Orders across platform</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Today', value: stats?.today },
                { label: 'This week', value: stats?.this_week },
                { label: 'This year', value: stats?.this_year },
                { label: 'All time', value: stats?.all_time },
              ].map(({ label, value }) => (
                <div key={label} className="card">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-3xl font-extrabold text-gray-900">
                    {value == null ? '—' : value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800">Maintenance</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={resequenceAll}
                disabled={reseqRunning}
                className="text-sm text-orange-600 border border-orange-200 hover:bg-orange-50 px-3 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {reseqRunning ? 'Resequencing…' : 'Fix order numbers (all tenants)'}
              </button>
              {reseqMsg && <span className="text-sm text-green-700 font-medium">{reseqMsg}</span>}
            </div>
            <p className="text-xs text-gray-400">Fixes duplicate daily order numbers across all tenants. Safe to run at any time.</p>
          </div>
        </div>
      )}

      {/* ── Tenant management tab ── */}
      {tab === 'tenants' && (
        <div className="space-y-8">
          {/* Copy tenant data */}
          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Copy tenant data</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Copy catalog (categories, products, photos) and settings from one account to another. Overwrites the destination. Orders are excluded by default to avoid copying customer personal data.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 mb-1">Copy FROM (owner email)</label>
                <input value={copyFrom} onChange={e => setCopyFrom(e.target.value)} placeholder="source@example.com" className="input-field" />
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 mb-1">Copy TO (owner email)</label>
                <input value={copyTo} onChange={e => setCopyTo(e.target.value)} placeholder="dest@example.com" className="input-field" />
              </div>
              <div className="flex flex-col justify-end gap-2 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={copyOrders}
                    onChange={e => setCopyOrders(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs text-gray-600">Include orders <span className="text-orange-500 font-medium">(copies customer data)</span></span>
                </label>
                <button
                  onClick={copyTenant}
                  disabled={copyRunning || !copyFrom || !copyTo}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {copyRunning ? 'Copying…' : 'Copy →'}
                </button>
              </div>
            </div>
            {copyResult && (
              <p className={`text-sm font-medium ${copyResult.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>
                {copyResult}
              </p>
            )}
          </div>

          {/* Delete user by email */}
          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Delete user account</h2>
              <p className="text-sm text-gray-500 mt-0.5">Remove a stuck or orphaned user account by email so the address can be reused. Does not delete their tenant.</p>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
                <input value={deleteEmail} onChange={e => setDeleteEmail(e.target.value)} placeholder="user@example.com" className="input-field" type="email" />
              </div>
              <button
                onClick={deleteUserByEmail}
                disabled={deleteUserRunning || !deleteEmail}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 shrink-0"
              >
                {deleteUserRunning ? 'Deleting…' : 'Delete user'}
              </button>
            </div>
            {deleteUserMsg && (
              <p className={`text-sm font-medium ${deleteUserMsg.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>
                {deleteUserMsg}
              </p>
            )}
          </div>

          {/* Orphaned users */}
          {orphanedUsers.length > 0 && (
            <div className="card space-y-3 border-orange-100">
              <div>
                <h2 className="font-semibold text-gray-800">Orphaned accounts <span className="text-sm font-normal text-orange-500">({orphanedUsers.length})</span></h2>
                <p className="text-sm text-gray-500 mt-0.5">Users with no store — typically unverified or failed registrations. Safe to delete so the email can be reused.</p>
              </div>
              <div className="divide-y divide-gray-50">
                {orphanedUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.email}</p>
                      <p className="text-xs text-gray-400">{u.full_name} · joined {new Date(u.date_joined).toLocaleDateString('en-GB')} · {u.email_verified ? 'verified' : <span className="text-orange-500">unverified</span>}</p>
                    </div>
                    <button
                      onClick={() => deleteOrphan(u.id)}
                      disabled={orphanDeleting === u.id}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {orphanDeleting === u.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tenant list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-600">
                All tenants {tenants.length > 0 && <span className="text-gray-400">({tenants.length})</span>}
              </h2>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, slug or owner email…"
              className="input-field mb-4 max-w-sm"
            />
            {loading ? (
              <p className="text-gray-400">Loading…</p>
            ) : (
              <div className="card p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Subscription</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Orders</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((t) => (
                      <tr key={t.slug} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.slug}</td>
                        <td className="px-4 py-3">
                          <div className="text-gray-800 text-xs">{t.owner_name || '—'}</div>
                          <div className="text-gray-400 text-xs">{t.owner_email || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {t.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.subscription_status ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUB_BADGE[t.subscription_status] || 'bg-gray-100 text-gray-500'}`}>
                              {t.subscription_status}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700">{t.order_count}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(t.created_at).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/superadmin/tenants/${t.slug}`} className="text-brand-600 hover:underline text-xs font-medium">
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                          {loading ? 'Loading…' : 'No tenants found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
