'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  updated_at: string
}

const SUB_BADGE: Record<string, string> = {
  active:    'bg-green-50 text-green-700',
  trialing:  'bg-blue-50 text-blue-700',
  past_due:  'bg-red-50 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [reseqMsg, setReseqMsg] = useState('')
  const [reseqRunning, setReseqRunning] = useState(false)
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null)
  const [mfaSaving, setMfaSaving] = useState(false)

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

  const toggleMfa = async (value: boolean) => {
    setMfaSaving(true)
    try {
      const r = await api.patch('/api/auth/admin/platform-config/', { mfa_required: value })
      setPlatformConfig(r.data)
    } finally {
      setMfaSaving(false)
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
  }, [])

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.owner_email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platform admin</h1>
        <div className="flex items-center gap-3">
          {reseqMsg && <span className="text-sm text-green-700 font-medium">{reseqMsg}</span>}
          <button
            onClick={resequenceAll}
            disabled={reseqRunning}
            className="text-sm text-orange-600 border border-orange-200 hover:bg-orange-50 px-3 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {reseqRunning ? 'Resequencing…' : 'Fix order numbers (all tenants)'}
          </button>
        </div>
      </div>

      {/* Platform settings */}
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
      </div>

      {/* Platform stats */}
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
  )
}
