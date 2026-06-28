'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

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
  { value: 'dashboard', label: 'Dashboard',  icon: '🏠', hint: 'Today\'s summary' },
  { value: 'menu',      label: 'Menu editor', icon: '🍽️', hint: 'Edit products & categories' },
  { value: 'inventory', label: 'Inventory',  icon: '📦', hint: 'Stock levels' },
  { value: 'wastage',   label: 'Wastage',    icon: '🗑️', hint: 'Wastage log' },
  { value: 'analytics', label: 'Analytics',  icon: '📊', hint: 'Sales & revenue' },
  { value: 'settings',  label: 'Settings',   icon: '⚙️', hint: 'Store settings' },
]

interface Tenant {
  name: string
  slug: string
  theme: string
  qr_code_svg: string
  banner: string | null
  kitchen_nav_items: string[]
  order_number_mode: string
}

interface Subscription {
  plan: string
  plan_tier: { id: number; name: string; description: string; features: string[]; monthly_price: string; annual_price: string } | null
  status: string
  next_billing_date: string | null
  annual_cost: string
}

interface Plan {
  id: number
  name: string
  description: string
  features: string[]
  monthly_price: string
  annual_price: string
  is_highlighted: boolean
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [form, setForm] = useState({ name: '', theme: 'default' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [kitchenNav, setKitchenNav] = useState<string[]>([])
  const [kitchenNavSaving, setKitchenNavSaving] = useState(false)
  const [kitchenNavSaved, setKitchenNavSaved] = useState(false)
  const [orderMode, setOrderMode] = useState<'daily' | 'total'>('daily')
  const [orderModeSaving, setOrderModeSaving] = useState(false)
  const [orderModeSaved, setOrderModeSaved] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [planSaving, setPlanSaving] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoCropY, setLogoCropY] = useState(50)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoSaved, setLogoSaved] = useState(false)
  const logoImgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    api.get('/api/tenants/me/').then((r) => {
      setTenant(r.data)
      setForm({ name: r.data.name, theme: r.data.theme })
      setKitchenNav(r.data.kitchen_nav_items || [])
      setOrderMode(r.data.order_number_mode || 'daily')
    })
    api.get('/api/subscriptions/status/').then((r) => {
      setSubscription(r.data)
      setSelectedPlanId(r.data.plan_tier?.id ?? null)
    }).catch(() => {})
    api.get('/api/subscriptions/plans/').then((r) => setPlans(r.data)).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch('/api/tenants/me/', form)
      setTenant(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const saveKitchenNav = async () => {
    setKitchenNavSaving(true)
    try {
      const { data } = await api.patch('/api/tenants/me/', { kitchen_nav_items: kitchenNav })
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
      await api.patch('/api/tenants/me/', { order_number_mode: orderMode })
      setOrderModeSaved(true)
      setTimeout(() => setOrderModeSaved(false), 3000)
    } finally {
      setOrderModeSaving(false)
    }
  }

  const savePlan = async () => {
    if (!selectedPlanId) return
    setPlanSaving(true)
    try {
      const { data } = await api.patch('/api/subscriptions/status/', { plan_tier_id: selectedPlanId })
      setSubscription(data)
      setPlanSaved(true)
      setTimeout(() => setPlanSaved(false), 3000)
    } finally {
      setPlanSaving(false)
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
    const url = URL.createObjectURL(file)
    setLogoPreviewUrl(url)
  }

  const uploadLogo = async () => {
    if (!logoFile || !logoImgRef.current) return
    const img = logoImgRef.current
    const CROP_W = 900
    const CROP_H = 400
    const canvas = document.createElement('canvas')
    canvas.width = CROP_W
    canvas.height = CROP_H
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
        const { data } = await api.patch('/api/tenants/me/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setTenant(data)
        setLogoFile(null)
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
    await api.patch('/api/tenants/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    setTenant((prev) => prev ? { ...prev, banner: null } : prev)
    setLogoPreviewUrl(null)
    setLogoFile(null)
  }

  const downloadSVG = () => {
    if (!tenant?.qr_code_svg) return
    const blob = new Blob([tenant.qr_code_svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tenant.slug}-qr.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!tenant) return <div className="p-8 text-gray-400">Loading settings…</div>

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Store details */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Store details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store name</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
          <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            https://{tenant.slug}.eventifood.com
          </p>
        </div>

        {/* Theme picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Colour theme</label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm((p) => ({ ...p, theme: t.value }))}
                title={t.label}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 transition-all ${form.theme === t.value ? 'border-gray-900' : 'border-transparent hover:border-gray-200'}`}
              >
                <span className="w-8 h-8 rounded-full block" style={{ backgroundColor: t.color }} />
                <span className="text-xs text-gray-600">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>

      {/* Logo / header image */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Store logo / header image</h2>
        <p className="text-sm text-gray-500">This image appears at the top of your ordering page on customers&apos; phones. Choose an image, then drag the slider to position the crop.</p>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
          <span className="font-semibold">Recommended size:</span> 900 × 400 px minimum, landscape orientation. A wider or taller image gives you more flexibility to reposition the crop. JPEG or PNG.
        </div>

        {/* Preview — shows current or newly picked image */}
        {(logoPreviewUrl || tenant.banner) && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview (as it appears in your store header)</p>
            <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '9/4' }}>
              <img
                src={logoPreviewUrl || tenant.banner!}
                alt="Logo preview"
                className="w-full h-full object-cover"
                style={{ objectPosition: `center ${logoCropY}%` }}
              />
            </div>
            {logoPreviewUrl && logoFile && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-medium">Vertical position</label>
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
          </div>
        )}

        {/* Hidden img used for canvas drawing when file is picked */}
        {logoPreviewUrl && (
          <img ref={logoImgRef} src={logoPreviewUrl} alt="" className="hidden" crossOrigin="anonymous" />
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <label className="btn-secondary cursor-pointer text-sm">
            {tenant.banner || logoPreviewUrl ? 'Change image' : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={onLogoFilePicked} />
          </label>
          {logoFile && (
            <button onClick={uploadLogo} disabled={logoUploading} className="btn-primary text-sm">
              {logoUploading ? 'Uploading…' : logoSaved ? 'Saved ✓' : 'Save logo'}
            </button>
          )}
          {logoSaved && !logoFile && (
            <span className="text-green-600 text-sm font-medium">Logo saved ✓</span>
          )}
          {tenant.banner && !logoFile && (
            <button onClick={removeLogo} className="text-sm text-red-500 hover:text-red-700 font-medium">
              Remove logo
            </button>
          )}
        </div>
      </div>

      {/* Order number mode */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Order counter</h2>
        <p className="text-sm text-gray-500">
          Controls how order numbers are displayed on the kitchen board and customer receipts.
        </p>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="orderMode"
              value="daily"
              checked={orderMode === 'daily'}
              onChange={() => setOrderMode('daily')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Daily — resets to #1 each day</p>
              <p className="text-xs text-gray-400">Each trading day starts fresh: #1, #2, #3… Perfect for busy days where small numbers are easier to call out.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="orderMode"
              value="total"
              checked={orderMode === 'total'}
              onChange={() => setOrderMode('total')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Total — cumulative, never resets</p>
              <p className="text-xs text-gray-400">Numbers keep counting forever: #0001, #0002… Shows your total order history at a glance.</p>
            </div>
          </label>
        </div>
        <button onClick={saveOrderMode} disabled={orderModeSaving} className="btn-primary text-sm">
          {orderModeSaving ? 'Saving…' : orderModeSaved ? 'Saved ✓' : 'Save counter setting'}
        </button>
      </div>

      {/* QR Code */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">QR Code</h2>
        {tenant.qr_code_svg ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-96 h-96 border border-gray-200 rounded-lg p-3 [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: tenant.qr_code_svg }}
            />
            <div className="flex gap-3">
              <button onClick={downloadSVG} className="btn-secondary text-sm">
                Download SVG
              </button>
              <button
                onClick={() => window.open('/seller/display', '_blank', 'width=900,height=900')}
                className="btn-secondary text-sm"
              >
                Full-screen display
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Print and display this at your truck so customers can scan to order.<br />
              Use "Full-screen display" to show the QR on a secondary monitor or tablet.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">QR code not yet generated.</p>
        )}
      </div>

      {/* Kitchen board */}
      <div className="card space-y-5">
        <h2 className="font-semibold text-gray-700">Kitchen board</h2>
        <p className="text-sm text-gray-500">
          Open the kitchen display in kiosk mode on a dedicated tablet or secondary screen.
          Kitchen staff see only the board — orders land and get marked ready from here.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.open('/seller/orders/board?kiosk=1', '_blank')}
            className="btn-secondary text-sm"
          >
            Open kitchen board
          </button>
        </div>

        {/* Kitchen nav visibility */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Sidebar access in kiosk mode</h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose which sections kitchen staff can navigate to from the board.
            Untick all to show the board only — no sidebar.
          </p>
          <div className="space-y-2">
            {KITCHEN_NAV_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={kitchenNav.includes(opt.value)}
                  onChange={() => toggleKitchenNav(opt.value)}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <span className="text-base">{opt.icon}</span>
                <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.hint}</span>
              </label>
            ))}
          </div>
          <button
            onClick={saveKitchenNav}
            disabled={kitchenNavSaving}
            className="btn-primary mt-4 text-sm"
          >
            {kitchenNavSaving ? 'Saving…' : kitchenNavSaved ? 'Saved ✓' : 'Save kitchen settings'}
          </button>
        </div>
      </div>

      {/* Payments */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-700">Payments</h2>
            <p className="text-sm text-gray-500 mt-0.5">Connect Stripe to accept card payments from customers.</p>
          </div>
          <Link href="/seller/settings/payments" className="btn-secondary text-sm shrink-0">
            Manage →
          </Link>
        </div>
      </div>

      {/* Subscription */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Subscription</h2>
        {subscription ? (
          <>
            <div className="space-y-2 text-sm pb-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Current plan</span>
                {subscription.plan_tier ? (
                  <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full text-xs">
                    {subscription.plan_tier.name}
                  </span>
                ) : (
                  <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                    Pay As You Go
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium capitalize ${subscription.status === 'active' ? 'text-green-600' : subscription.status === 'trialing' ? 'text-blue-600' : 'text-red-500'}`}>
                  {subscription.status}
                </span>
              </div>
              {subscription.plan_tier ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Annual cost</span>
                    <span className="font-medium">£{Number(subscription.annual_cost).toFixed(2)}</span>
                  </div>
                  {subscription.next_billing_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next billing</span>
                      <span className="font-medium">{subscription.next_billing_date}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform fee</span>
                  <span className="font-medium text-gray-700">2% per order · no monthly charge</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Switch plan</h3>
              {plans.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {plans.map((plan) => (
                      <label
                        key={plan.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlanId === plan.id}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
                            {plan.is_highlighted && (
                              <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">Popular</span>
                            )}
                          </div>
                          {plan.description && <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>}
                          <p className="text-xs text-gray-500 mt-0.5">
                            £{Number(plan.monthly_price).toFixed(2)}/mo · £{Number(plan.annual_price).toFixed(2)}/yr
                          </p>
                          {plan.features?.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {plan.features.map((f, i) => (
                                <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                                  <span className="text-green-500">✓</span> {f}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={savePlan}
                    disabled={planSaving || selectedPlanId === subscription.plan_tier?.id}
                    className="btn-primary mt-3 text-sm disabled:opacity-30"
                  >
                    {planSaving ? 'Saving…' : planSaved ? 'Saved ✓' : 'Switch plan'}
                  </button>
                </>
              ) : (
                <div className="bg-brand-50 rounded-xl px-4 py-3 text-sm text-brand-700">
                  <p className="font-semibold">Pay As You Go</p>
                  <p className="text-xs text-brand-600 mt-0.5">
                    2% platform fee per order · no monthly charge · Stripe processing fees apply separately
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    To discuss alternative plan options, contact support.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">No subscription found.</p>
        )}
      </div>
    </div>
  )
}
