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

  useEffect(() => {
    api.get('/api/tenants/admin/')
      .then((r) => setTenants(r.data))
      .finally(() => setLoading(false))
    api.get('/api/orders/platform/stats/')
      .then((r) => setStats(r.data))
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
      <h1 className="text-2xl font-bold text-gray-900">Platform admin</h1>

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
