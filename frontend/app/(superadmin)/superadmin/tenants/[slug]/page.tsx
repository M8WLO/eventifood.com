'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface TenantInfo {
  slug: string
  name: string
  account_number: string
  is_active: boolean
  is_demo: boolean
  theme: string
  banner: string | null
  payment_mode: string
  wait_time_enabled: boolean
  order_number_mode: string
  created_at: string
  trial_expires_at: string | null
}

const THEMES = [
  { value: 'default', label: 'Purple',  color: '#7c3aed' },
  { value: 'sunset',  label: 'Sunset',  color: '#e11d48' },
  { value: 'ocean',   label: 'Ocean',   color: '#0891b2' },
  { value: 'forest',  label: 'Forest',  color: '#16a34a' },
  { value: 'amber',   label: 'Amber',   color: '#d97706' },
  { value: 'coral',   label: 'Coral',   color: '#ea580c' },
  { value: 'ruby',    label: 'Ruby',    color: '#dc2626' },
  { value: 'teal',    label: 'Teal',    color: '#0d9488' },
  { value: 'indigo',  label: 'Indigo',  color: '#4f46e5' },
  { value: 'navy',    label: 'Navy',    color: '#1d4ed8' },
  { value: 'pink',    label: 'Pink',    color: '#db2777' },
  { value: 'slate',   label: 'Slate',   color: '#475569' },
]

const KITCHEN_NAV_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard',   icon: '🏠', hint: 'Today\'s summary' },
  { value: 'menu',      label: 'Menu editor', icon: '🍽️', hint: 'Edit products & categories' },
  { value: 'inventory', label: 'Inventory',   icon: '📦', hint: 'Stock levels' },
  { value: 'wastage',   label: 'Wastage',     icon: '🗑️', hint: 'Wastage log' },
  { value: 'analytics', label: 'Analytics',   icon: '📊', hint: 'Sales & revenue' },
  { value: 'settings',  label: 'Settings',    icon: '⚙️', hint: 'Store settings' },
]

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
  plan: string             // billing cycle: 'monthly_split' | 'annual'
  plan_tier: { id: number; name: string; billing_model: string } | null
  status: string
  annual_cost: string
  started_at: string | null
  next_billing_date: string | null
  stripe_customer_id: string
  stripe_subscription_id: string
}

interface PlanOption {
  id: number
  name: string
  billing_model: string
}

const TABS = ['Overview', 'Settings', 'Users', 'Orders', 'Subscription'] as const
type Tab = (typeof TABS)[number]

const SUB_STATUSES = ['trialing', 'active', 'cancelled', 'past_due']
const BILLING_CYCLES = ['monthly_split', 'annual']
const STATUS_BADGE: Record<string, string> = {
  placed:    'bg-green-50 text-green-700',
  preparing: 'bg-orange-50 text-orange-700',
  ready:     'bg-purple-50 text-purple-700',
  collected: 'bg-gray-100 text-gray-500',
}

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [tab, setTab] = useState<Tab>('Overview')
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [sub, setSub] = useState<Sub | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [plans, setPlans] = useState<PlanOption[]>([])

  // User edit modal state
  const [editUser, setEditUser] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState({ email: '', full_name: '', is_active: true, mfa_enabled: true })
  const [resetPw, setResetPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  // Sub form state
  const [subForm, setSubForm] = useState({
    status: '',
    plan: '',            // billing cycle: monthly_split | annual
    plan_tier_id: '' as string | null,  // FK to Plan model (null = no plan)
    annual_cost: '',
    started_at: '',
    next_billing_date: '',
    stripe_customer_id: '',
    stripe_subscription_id: '',
  })

  // Trial
  const [trialDate, setTrialDate] = useState('')
  const [trialSaving, setTrialSaving] = useState(false)

  // Settings form — mirrors seller settings page
  const [settingsForm, setSettingsForm] = useState({ name: '', theme: 'default' })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [kitchenNav, setKitchenNav] = useState<string[]>([])
  const [kitchenNavSaving, setKitchenNavSaving] = useState(false)
  const [kitchenNavSaved, setKitchenNavSaved] = useState(false)
  const [orderMode, setOrderMode] = useState<'daily' | 'total'>('daily')
  const [orderModeSaving, setOrderModeSaving] = useState(false)
  const [orderModeSaved, setOrderModeSaved] = useState(false)
  const [waitTimeEnabled, setWaitTimeEnabled] = useState(false)
  const [waitTimeSaving, setWaitTimeSaving] = useState(false)
  const [waitTimeSaved, setWaitTimeSaved] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoCropY, setLogoCropY] = useState(50)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoSaved, setLogoSaved] = useState(false)
  const logoImgRef = useRef<HTMLImageElement>(null)

  // Delete
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Order search
  const [orderSearch, setOrderSearch] = useState('')

  useEffect(() => {
    api.get(`/api/tenants/admin/${slug}/`).then((r) => {
      setTenant(r.data)
      setTrialDate(r.data.trial_expires_at || '')
      setSettingsForm({ name: r.data.name || '', theme: r.data.theme || 'default' })
      setKitchenNav(r.data.kitchen_nav_items || [])
      setOrderMode(r.data.order_number_mode || 'daily')
      setWaitTimeEnabled(!!r.data.wait_time_enabled)
    })
    api.get(`/api/tenants/admin/${slug}/members/`).then((r) => setMembers(r.data))
    api.get(`/api/tenants/admin/${slug}/orders/`).then((r) => setOrders(r.data)).catch(() => {})
    api.get('/api/subscriptions/plans/admin/').then((r) => setPlans(r.data)).catch(() => {})
    api.get(`/api/subscriptions/admin/${slug}/`).then((r) => {
      setSub(r.data)
      setSubForm({
        status: r.data.status || '',
        plan: r.data.plan || '',
        plan_tier_id: r.data.plan_tier?.id != null ? String(r.data.plan_tier.id) : null,
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

  const toggleDemo = async () => {
    if (!tenant) return
    setSaving(true)
    try {
      const { data } = await api.patch(`/api/tenants/admin/${slug}/`, { is_demo: !tenant.is_demo })
      setTenant(data)
      flash(data.is_demo ? 'Demo mode enabled.' : 'Demo mode disabled.')
    } finally {
      setSaving(false)
    }
  }

  const saveTrial = async () => {
    setTrialSaving(true)
    try {
      const { data } = await api.patch(`/api/tenants/admin/${slug}/`, {
        trial_expires_at: trialDate || null,
      })
      setTenant(data)
      setTrialDate(data.trial_expires_at || '')
      flash(trialDate ? `Trial set — expires ${new Date(trialDate).toLocaleDateString('en-GB')}.` : 'Trial date cleared.')
    } finally {
      setTrialSaving(false)
    }
  }

  const saveSettings = async () => {
    setSettingsSaving(true)
    try {
      const { data } = await api.patch(`/api/tenants/admin/${slug}/`, settingsForm)
      setTenant(data)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } finally {
      setSettingsSaving(false)
    }
  }

  const saveKitchenNav = async () => {
    setKitchenNavSaving(true)
    try {
      const { data } = await api.patch(`/api/tenants/admin/${slug}/`, { kitchen_nav_items: kitchenNav })
      setTenant(data)
      setKitchenNavSaved(true)
      setTimeout(() => setKitchenNavSaved(false), 3000)
    } finally {
      setKitchenNavSaving(false)
    }
  }

  const saveOrderMode = async () => {
    setOrderModeSaving(true)
    try {
      await api.patch(`/api/tenants/admin/${slug}/`, { order_number_mode: orderMode })
      setOrderModeSaved(true)
      setTimeout(() => setOrderModeSaved(false), 3000)
    } finally {
      setOrderModeSaving(false)
    }
  }

  const saveWaitTime = async () => {
    setWaitTimeSaving(true)
    try {
      await api.patch(`/api/tenants/admin/${slug}/`, { wait_time_enabled: waitTimeEnabled })
      setWaitTimeSaved(true)
      setTimeout(() => setWaitTimeSaved(false), 3000)
    } finally {
      setWaitTimeSaving(false)
    }
  }

  const toggleKitchenNav = (value: string) => {
    setKitchenNav((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const onLogoFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoCropY(50)
    setLogoPreviewUrl(URL.createObjectURL(file))
  }

  const uploadLogo = async () => {
    if (!logoFile || !logoImgRef.current) return
    const img = logoImgRef.current
    const CROP_W = 900, CROP_H = 400
    const canvas = document.createElement('canvas')
    canvas.width = CROP_W; canvas.height = CROP_H
    const ctx = canvas.getContext('2d')!
    const scale = Math.max(CROP_W / img.naturalWidth, CROP_H / img.naturalHeight)
    const scaledW = img.naturalWidth * scale
    const scaledH = img.naturalHeight * scale
    const offsetX = (CROP_W - scaledW) / 2
    const offsetY = (CROP_H - scaledH) * (logoCropY / 100)
    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      setLogoUploading(true)
      try {
        const fd = new FormData()
        fd.append('banner', blob, 'logo.jpg')
        const { data } = await api.patch(`/api/tenants/admin/${slug}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setTenant(data)
        setLogoFile(null)
        setLogoPreviewUrl(null)
        setLogoSaved(true)
        setTimeout(() => setLogoSaved(false), 3000)
      } finally {
        setLogoUploading(false)
      }
    }, 'image/jpeg', 0.92)
  }

  const removeLogo = async () => {
    const fd = new FormData()
    fd.append('banner', '')
    await api.patch(`/api/tenants/admin/${slug}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    setTenant((prev) => prev ? { ...prev, banner: null } : prev)
    setLogoPreviewUrl(null)
    setLogoFile(null)
  }

  const deleteTenant = async () => {
    if (!tenant || deleteConfirm !== tenant.name) return
    setDeleting(true)
    try {
      await api.delete(`/api/tenants/admin/${slug}/`, { data: { confirm_name: deleteConfirm } })
      router.push('/superadmin')
    } catch {
      flash('Delete failed — check server logs.')
      setDeleting(false)
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
        status: subForm.status,
        plan: subForm.plan,
        plan_tier_id: subForm.plan_tier_id ? Number(subForm.plan_tier_id) : null,
        annual_cost: subForm.annual_cost,
        started_at: subForm.started_at || null,
        next_billing_date: subForm.next_billing_date || null,
        stripe_customer_id: subForm.stripe_customer_id,
        stripe_subscription_id: subForm.stripe_subscription_id,
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
          {tenant.account_number && (
            <p className="text-xs font-mono text-brand-600 mt-1 bg-brand-50 inline-block px-2 py-0.5 rounded">
              {tenant.account_number}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/store/${tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-600 hover:underline"
          >
            View store ↗
          </a>
          <button
            onClick={() => { setShowDelete(true); setDeleteConfirm('') }}
            className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Delete account
          </button>
        </div>
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
                <p className="text-gray-400 mb-1">Account number</p>
                <p className="font-mono text-xs font-semibold text-brand-700">{tenant.account_number || '—'}</p>
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
              <div>
                <p className="text-gray-400 mb-1">Demo mode</p>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tenant.is_demo ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {tenant.is_demo ? 'Demo / test store' : 'Live store'}
                  </span>
                  <button
                    onClick={toggleDemo}
                    disabled={saving}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    {tenant.is_demo ? 'Set live' : 'Set as demo'}
                  </button>
                </div>
                {tenant.is_demo && (
                  <p className="text-xs text-orange-600 mt-1">Customers see a demo banner. No payments are charged.</p>
                )}
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-700">Free trial</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Store accepts orders until this date. After expiry, a subscription is required.
                </p>
              </div>
              {tenant.trial_expires_at && (() => {
                const exp = new Date(tenant.trial_expires_at)
                const today = new Date(); today.setHours(0,0,0,0)
                const expired = exp < today
                return (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${expired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {expired ? 'Expired' : 'Active trial'}
                  </span>
                )
              })()}
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Trial expires on</label>
                <input
                  type="date"
                  value={trialDate}
                  onChange={(e) => setTrialDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <button
                onClick={saveTrial}
                disabled={trialSaving}
                className="btn-primary shrink-0"
              >
                {trialSaving ? 'Saving…' : 'Save'}
              </button>
              {trialDate && (
                <button
                  onClick={() => { setTrialDate(''); }}
                  className="shrink-0 text-xs text-gray-400 hover:text-red-500 underline pb-2"
                >
                  Clear
                </button>
              )}
            </div>
            {!tenant.trial_expires_at && (
              <p className="text-xs text-gray-400">No trial date set — store is accessible indefinitely.</p>
            )}
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

      {/* Settings */}
      {tab === 'Settings' && (
        <div className="space-y-4 max-w-lg">

          {/* Store details */}
          <div className="card space-y-5">
            <h2 className="font-semibold text-gray-700">Store details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store name</label>
              <input
                value={settingsForm.name}
                onChange={(e) => setSettingsForm((p) => ({ ...p, name: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colour theme</label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    title={t.label}
                    onClick={() => setSettingsForm((p) => ({ ...p, theme: t.value }))}
                    style={{ backgroundColor: t.color }}
                    className={`w-8 h-8 rounded-full transition-all ${
                      settingsForm.theme === t.value
                        ? 'ring-2 ring-offset-2 ring-gray-600 scale-110'
                        : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {THEMES.find((t) => t.value === settingsForm.theme)?.label ?? 'Default'}
              </p>
            </div>
            <button
              onClick={saveSettings}
              disabled={settingsSaving}
              className="btn-primary"
            >
              {settingsSaving ? 'Saving…' : settingsSaved ? 'Saved ✓' : 'Save details'}
            </button>
          </div>

          {/* Logo */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-700">Logo / banner</h2>
            {(logoPreviewUrl || tenant.banner) && (
              <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style={{ aspectRatio: '9/4' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={logoImgRef}
                  src={logoPreviewUrl || tenant.banner!}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `center ${logoCropY}%` }}
                />
              </div>
            )}
            {logoPreviewUrl && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Crop position — drag to adjust vertical position
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={logoCropY}
                  onChange={(e) => setLogoCropY(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className="btn-secondary cursor-pointer">
                {logoPreviewUrl ? 'Change image' : 'Choose image'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onLogoFilePicked}
                />
              </label>
              {logoPreviewUrl && (
                <button
                  onClick={uploadLogo}
                  disabled={logoUploading}
                  className="btn-primary"
                >
                  {logoUploading ? 'Uploading…' : logoSaved ? 'Saved ✓' : 'Save logo'}
                </button>
              )}
              {tenant.banner && !logoPreviewUrl && (
                <button
                  onClick={removeLogo}
                  className="text-sm text-red-500 hover:text-red-700 underline"
                >
                  Remove logo
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">Recommended: 900×400px (9:4 ratio). JPG or PNG.</p>
          </div>

          {/* Order counter */}
          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold text-gray-700">Order counter</h2>
              <p className="text-sm text-gray-400 mt-0.5">Controls how orders are numbered on the kitchen board.</p>
            </div>
            <div className="space-y-3">
              {(['daily', 'total'] as const).map((mode) => (
                <label key={mode} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="orderMode"
                    value={mode}
                    checked={orderMode === mode}
                    onChange={() => setOrderMode(mode)}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {mode === 'daily' ? 'Daily counter' : 'Running total'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {mode === 'daily'
                        ? 'Resets to #1 each day — great for high-volume events'
                        : 'Never resets — easy to reference any historic order'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={saveOrderMode}
              disabled={orderModeSaving}
              className="btn-primary"
            >
              {orderModeSaving ? 'Saving…' : orderModeSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>

          {/* Wait time */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-700">Live wait time</h2>
                <p className="text-sm text-gray-400 mt-0.5">Show an estimated wait time to customers placing orders.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={waitTimeEnabled}
                onClick={() => setWaitTimeEnabled((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${waitTimeEnabled ? 'bg-brand-600' : 'bg-gray-200'}`}
              >
                <span className="sr-only">Enable wait time</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${waitTimeEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={saveWaitTime}
                disabled={waitTimeSaving}
                className="btn-primary"
              >
                {waitTimeSaving ? 'Saving…' : waitTimeSaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          </div>

          {/* Kitchen board nav */}
          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold text-gray-700">Kitchen board navigation</h2>
              <p className="text-sm text-gray-400 mt-0.5">Choose which items appear in the kitchen board side menu.</p>
            </div>
            <div className="space-y-2">
              {KITCHEN_NAV_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={kitchenNav.includes(opt.value)}
                    onChange={() => toggleKitchenNav(opt.value)}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <span className="text-lg">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={saveKitchenNav}
              disabled={kitchenNavSaving}
              className="btn-primary"
            >
              {kitchenNavSaving ? 'Saving…' : kitchenNavSaved ? 'Saved ✓' : 'Save navigation'}
            </button>
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
          <div className="flex items-center gap-4 mb-4">
            <input
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search by name or order number…"
              className="input-field max-w-sm"
            />
            <button
              onClick={async () => {
                if (!confirm(`Resequence daily order numbers for ${slug}? This will reassign #0001, #0002… to all orders from the last 18 hours in time order, fixing any duplicates.`)) return
                try {
                  const r = await api.post(`/api/orders/admin/${slug}/resequence/`)
                  setMsg(`Resequenced ${r.data.resequenced} orders — reload the page to see updated numbers.`)
                  setTimeout(() => setMsg(''), 5000)
                } catch {
                  setMsg('Resequence failed.')
                }
              }}
              className="text-sm text-orange-600 border border-orange-200 hover:bg-orange-50 px-3 py-2 rounded-lg font-medium"
            >
              Fix duplicate order numbers
            </button>
            {msg && <span className="text-sm text-green-700">{msg}</span>}
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString('en-GB')} {new Date(o.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Plan tier</label>
                  <select
                    value={subForm.plan_tier_id ?? ''}
                    onChange={(e) => setSubForm((p) => ({ ...p, plan_tier_id: e.target.value || null }))}
                    className="input-field"
                  >
                    <option value="">— No plan —</option>
                    {plans.map((pl) => (
                      <option key={pl.id} value={String(pl.id)}>{pl.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Billing cycle</label>
                  <select
                    value={subForm.plan}
                    onChange={(e) => setSubForm((p) => ({ ...p, plan: e.target.value }))}
                    className="input-field"
                  >
                    {BILLING_CYCLES.map((s) => <option key={s} value={s}>{s === 'monthly_split' ? 'Monthly' : 'Annual'}</option>)}
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

      {/* Delete confirmation modal */}
      {showDelete && tenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg flex-shrink-0">
                ⚠
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete account</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-1">
              <p className="font-semibold">The following will be permanently deleted:</p>
              <ul className="list-disc list-inside space-y-0.5 text-red-600">
                <li>All store data and settings</li>
                <li>All orders and order history</li>
                <li>All menu items and categories</li>
                <li>All user memberships</li>
                <li>Subscription records</li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="font-bold text-gray-900">{tenant.name}</span> to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={tenant.name}
                className="input-field"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteTenant}
                disabled={deleteConfirm !== tenant.name || deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
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
