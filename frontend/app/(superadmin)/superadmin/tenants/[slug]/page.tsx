'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface TenantInfo {
  slug: string
  name: string
  is_active: boolean
  theme: string
  created_at: string
}

interface Member {
  id: number
  email: string
  full_name: string
  role: string
  is_active: boolean
  mfa_enabled: boolean
  date_joined: string
}

interface OrderItem {
  product_name: string
  quantity: number
}

interface Order {
  id: number
  order_number: string
  daily_number?: number
  buyer_name: string
  status: string
  total: string
  created_at: string
  items: OrderItem[]
}

interface Sub {
  id: number
  plan: string
  status: string
  annual_cost: string
  started_at: string | null
  next_billing_date: string | null
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_tier: { id: number; name: string } | null
}

const TABS = ['Overview', 'Users', 'Orders', 'Subscription'] as const
type Tab = (typeof TABS)[number]

const SUB_STATUSES = ['trialing', 'active', 'cancelled', 'past_due']
const SUB_PLANS = ['monthly_split', 'annual']
const STATUS_BADGE: Record<string, string> = {
  placed:    'bg-green-50 text-green-700',
  preparing: 'bg-orange-50 text-orange-700',
  ready:     'bg-purple-50 text-purple-700',
  collected: 'bg-gray-100 text-gray-500',
}

export default function TenantDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [tab, setTab] = useState<Tab>('Overview')
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [sub, setSub] = useState<Sub | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // User edit modal state
  const [editUser, setEditUser] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState({ email: '', full_name: '', is_active: true, mfa_enabled: true })
  const [resetPw, setResetPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  // Sub form state
  const [subForm, setSubForm] = useState({
    status: '', plan: '', annual_cost: '',
    started_at: '', next_billing_date: '',
    stripe_customer_id: '', stripe_subscription_id: '',
  })

  // Order search
  const [orderSearch, setOrderSearch] = useState('')

  useEffect(() => {
    api.get(`/api/tenants/admin/${slug}/`).then((r) => setTenant(r.data))
    api.get(`/api/tenants/admin/${slug}/members/`).then((r) => setMembers(r.data))
    api.get(`/api/tenants/admin/${slug}/orders/`).then((r) => setOrders(r.data)).catch(() => {})
    api.get(`/api/subscriptions/admin/${slug}/`).then((r) => {
      setSub(r.data)
      setSubForm({
        status: r.data.status || '',
        plan: r.data.plan || '',
        annual_cost: r.data.annual_cost || '',
        started_at: r.data.started_at ? r.data.started_at.slice(0, 10) : '',
        next_billing_date: r.data.next_billing_date || '',
        stripe_customer_id: r.data.stripe_customer_id || '',
        stripe_subscription_id: r.data.stripe_subscription_id || '',
      })
    }).catch(() => {})
  }, [slug])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const toggleActive = async () => {
    if (!tenant) return
    setSaving(true)
    try {
      const { data } = await api.patch(`/api/tenants/admin/${slug}/`, { is_active: !tenant.is_active })
      setTenant(data)
      flash(data.is_active ? 'Tenant activated.' : 'Tenant deactivated.')
    } finally {
      setSaving(false)
    }
  }

  const openEditUser = (m: Member) => {
    setEditUser(m)
    setEditForm({ email: m.email, full_name: m.full_name, is_active: m.is_active, mfa_enabled: m.mfa_enabled })
    setResetPw('')
    setPwMsg('')
  }

  const saveUser = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      await api.patch(`/api/auth/admin/users/${editUser.id}/`, editForm)
      const r = await api.get(`/api/tenants/admin/${slug}/members/`)
      setMembers(r.data)
      flash('User updated.')
      setEditUser(null)
    } finally {
      setSaving(false)
    }
  }

  const resetPassword = async () => {
    if (!editUser || resetPw.length < 8) { setPwMsg('Minimum 8 characters'); return }
    setSaving(true)
    try {
      await api.post(`/api/auth/admin/users/${editUser.id}/reset-password/`, { password: resetPw })
      setPwMsg('Password updated.')
      setResetPw('')
    } finally {
      setSaving(false)
    }
  }

  const saveSub = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch(`/api/subscriptions/admin/${slug}/`, {
        ...subForm,
        started_at: subForm.started_at || null,
        next_billing_date: subForm.next_billing_date || null,
      })
      setSub(data)
      flash('Subscription saved.')
    } finally {
      setSaving(false)
    }
  }

  const filteredOrders = orders.filter(
    (o) =>
      !orderSearch ||
      o.buyer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.order_number.includes(orderSearch) ||
      String(o.daily_number ?? '').includes(orderSearch)
  )

  if (!tenant) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link href="/superadmin" className="text-brand-600 hover:underline text-sm">← All tenants</Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {tenant.slug} · Joined {new Date(tenant.created_at).toLocaleDateString('en-GB')}
          </p>
        </div>
        <a
          href={`/store/${tenant.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-brand-600 hover:underline"
        >
          View store ↗
        </a>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              tab === t
                ? 'bg-white border border-b-white border-gray-200 text-brand-700 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-700">Store details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Store name</p>
                <p className="font-medium">{tenant.name}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Slug</p>
                <p className="font-mono text-xs">{tenant.slug}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Theme</p>
                <p className="font-medium capitalize">{tenant.theme || 'default'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Status</p>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tenant.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={toggleActive}
                    disabled={saving}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    {tenant.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-700">Quick stats</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
              <div>
                <p className="text-gray-400">Orders (last 100)</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div>
                <p className="text-gray-400">Subscription</p>
                <p className="text-2xl font-bold capitalize">{sub?.status || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'Users' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">MFA</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'owner' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${m.is_active ? 'text-green-600' : 'text-red-500'}`}>
                      {m.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{m.mfa_enabled ? 'On' : 'Off'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(m.date_joined).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditUser(m)}
                      className="text-brand-600 hover:underline text-xs font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders */}
      {tab === 'Orders' && (
        <div>
          <input
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Search by name or order number…"
            className="input-field mb-4 max-w-sm"
          />
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {o.daily_number != null ? `#${o.daily_number}` : o.order_number}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{o.buyer_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {o.items?.map((i) => `${i.quantity}× ${i.product_name}`).join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[o.status] || 'bg-gray-100 text-gray-500'}`}>
                        {o.status === 'placed' ? 'new' : o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">£{Number(o.total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString('en-GB')} {new Date(o.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscription */}
      {tab === 'Subscription' && (
        <div className="card space-y-5 max-w-lg">
          <h2 className="font-semibold text-gray-700">Subscription details</h2>
          {!sub ? (
            <p className="text-gray-400 text-sm">No subscription found for this tenant.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={subForm.status}
                    onChange={(e) => setSubForm((p) => ({ ...p, status: e.target.value }))}
                    className="input-field"
                  >
                    {SUB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
                  <select
                    value={subForm.plan}
                    onChange={(e) => setSubForm((p) => ({ ...p, plan: e.target.value }))}
                    className="input-field"
                  >
                    {SUB_PLANS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Annual cost (£)</label>
                  <input
                    type="number"
                    value={subForm.annual_cost}
                    onChange={(e) => setSubForm((p) => ({ ...p, annual_cost: e.target.value }))}
                    className="input-field"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Started at</label>
                  <input
                    type="date"
                    value={subForm.started_at}
                    onChange={(e) => setSubForm((p) => ({ ...p, started_at: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Next billing date</label>
                  <input
                    type="date"
                    value={subForm.next_billing_date}
                    onChange={(e) => setSubForm((p) => ({ ...p, next_billing_date: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stripe IDs</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Customer ID</label>
                  <input
                    value={subForm.stripe_customer_id}
                    onChange={(e) => setSubForm((p) => ({ ...p, stripe_customer_id: e.target.value }))}
                    className="input-field font-mono text-xs"
                    placeholder="cus_…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Subscription ID</label>
                  <input
                    value={subForm.stripe_subscription_id}
                    onChange={(e) => setSubForm((p) => ({ ...p, stripe_subscription_id: e.target.value }))}
                    className="input-field font-mono text-xs"
                    placeholder="sub_…"
                  />
                </div>
              </div>

              <button
                onClick={saveSub}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving…' : 'Save subscription'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Edit user</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full name</label>
                <input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Account active
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.mfa_enabled}
                    onChange={(e) => setEditForm((p) => ({ ...p, mfa_enabled: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  MFA enabled
                </label>
              </div>
            </div>

            <button onClick={saveUser} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : 'Save changes'}
            </button>

            <div className="border-t pt-4 space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Reset password</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                  placeholder="New password (8+ chars)"
                  className="input-field flex-1"
                />
                <button
                  onClick={resetPassword}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl"
                >
                  Set
                </button>
              </div>
              {pwMsg && <p className={`text-xs ${pwMsg.includes('updated') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
