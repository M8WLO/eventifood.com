'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

const THEMES = [
  { value: 'default', label: 'Default', color: '#f97316' },
  { value: 'sunset', label: 'Sunset', color: '#e11d48' },
  { value: 'ocean', label: 'Ocean', color: '#0891b2' },
  { value: 'forest', label: 'Forest', color: '#16a34a' },
]

interface Tenant {
  name: string
  slug: string
  theme: string
  qr_code_svg: string
  banner: string | null
}

interface Subscription {
  plan: string
  status: string
  next_billing_date: string | null
  annual_cost: string
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [form, setForm] = useState({ name: '', theme: 'default' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/api/tenants/me/').then((r) => {
      setTenant(r.data)
      setForm({ name: r.data.name, theme: r.data.theme })
    })
    api.get('/api/subscriptions/status/').then((r) => setSubscription(r.data)).catch(() => {})
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
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm((p) => ({ ...p, theme: t.value }))}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all ${form.theme === t.value ? 'border-gray-900' : 'border-transparent hover:border-gray-200'}`}
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

      {/* QR Code */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">QR Code</h2>
        {tenant.qr_code_svg ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-48 h-48 border border-gray-200 rounded-lg p-2"
              dangerouslySetInnerHTML={{ __html: tenant.qr_code_svg }}
            />
            <button onClick={downloadSVG} className="btn-secondary text-sm">
              Download SVG
            </button>
            <p className="text-xs text-gray-400 text-center">
              Print and display this at your truck so customers can scan to order.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">QR code not yet generated.</p>
        )}
      </div>

      {/* Subscription */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-3">Subscription</h2>
        {subscription ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium capitalize">{subscription.plan.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium capitalize ${subscription.status === 'active' ? 'text-green-600' : subscription.status === 'trialing' ? 'text-blue-600' : 'text-red-500'}`}>
                {subscription.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Annual cost</span>
              <span className="font-medium">£{subscription.annual_cost}</span>
            </div>
            {subscription.next_billing_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Next billing</span>
                <span className="font-medium">{subscription.next_billing_date}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No subscription found.</p>
        )}
      </div>
    </div>
  )
}
