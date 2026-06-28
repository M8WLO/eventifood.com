'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Plan {
  id?: number
  name: string
  slug: string
  monthly_price: string
  annual_price: string
  platform_fee_percent: string
  description: string
  features: string[]
  feature_flags: string[]
  max_products: number | null
  max_categories: number | null
  max_staff: number | null
  is_active: boolean
  is_highlighted: boolean
  display_order: number
}

const FEATURE_FLAG_OPTIONS = [
  { key: 'inventory', label: 'Inventory management' },
  { key: 'wastage', label: 'Wastage tracking' },
  { key: 'print_menus', label: 'Print menu PDFs' },
  { key: 'events', label: 'Event pricing presets' },
  { key: 'analytics', label: 'Sales analytics' },
  { key: 'wait_time', label: 'Live wait time display' },
]

const EMPTY: Plan = {
  name: '', slug: '', monthly_price: '0', annual_price: '0', platform_fee_percent: '2.00',
  description: '', features: [], feature_flags: [],
  max_products: null, max_categories: null, max_staff: null,
  is_active: true, is_highlighted: false, display_order: 0,
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featuresText, setFeaturesText] = useState('')

  const load = () => {
    api.get('/api/subscriptions/plans/admin/')
      .then((r) => setPlans(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setModal({ ...EMPTY })
    setFeaturesText('')
    setError(null)
  }

  const openEdit = (p: Plan) => {
    setModal({ ...p, feature_flags: p.feature_flags || [] })
    setFeaturesText(p.features.join('\n'))
    setError(null)
  }

  const save = async () => {
    if (!modal) return
    setSaving(true)
    setError(null)
    const payload = {
      ...modal,
      features: featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
      feature_flags: modal.feature_flags || [],
      max_products: modal.max_products === null ? null : Number(modal.max_products),
      max_categories: modal.max_categories === null ? null : Number(modal.max_categories),
      max_staff: modal.max_staff === null ? null : Number(modal.max_staff),
    }
    try {
      if (modal.id) {
        await api.patch(`/api/subscriptions/plans/${modal.id}/`, payload)
      } else {
        await api.post('/api/subscriptions/plans/admin/', payload)
      }
      setModal(null)
      load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } }
      setError(JSON.stringify(err?.response?.data || 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const deletePlan = async (id: number) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return
    await api.delete(`/api/subscriptions/plans/${id}/`)
    load()
  }

  const field = (key: keyof Plan, label: string, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={(modal?.[key] ?? '') as string}
        onChange={(e) => setModal((p) => p ? { ...p, [key]: e.target.value } : p)}
        className="input-field"
      />
    </div>
  )

  const limitField = (key: 'max_products' | 'max_categories' | 'max_staff', label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} <span className="text-gray-400 font-normal">(blank = unlimited)</span></label>
      <input
        type="number"
        min={0}
        value={modal?.[key] ?? ''}
        onChange={(e) => setModal((p) => p ? { ...p, [key]: e.target.value === '' ? null : Number(e.target.value) } : p)}
        className="input-field"
        placeholder="Unlimited"
      />
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <button onClick={openNew} className="btn-primary text-sm px-4 py-2">+ New plan</button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fee %</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Feature flags</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.name}
                    {p.is_highlighted && <span className="ml-2 text-xs bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded">★ Popular</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3 text-gray-700">{Number(p.platform_fee_percent).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {(p.feature_flags || []).join(', ') || <span className="italic">none</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex items-center gap-3 justify-end">
                    <button onClick={() => openEdit(p)} className="text-brand-600 hover:underline text-xs font-medium">Edit</button>
                    <button onClick={() => p.id && deletePlan(p.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No plans yet. Create one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{modal.id ? 'Edit plan' : 'New plan'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {field('name', 'Plan name')}
              {field('slug', 'Slug (unique, e.g. starter)')}
              {field('description', 'Description')}
              <div className="grid grid-cols-2 gap-4">
                {field('platform_fee_percent', 'Platform fee %', 'number')}
                {field('display_order', 'Display order', 'number')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features <span className="text-gray-400 font-normal">(display text, one per line)</span>
                </label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="input-field"
                  rows={5}
                  placeholder="QR code ordering&#10;Live kitchen board&#10;Inventory management"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feature flags <span className="text-gray-400 font-normal">(gates which app features are unlocked)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURE_FLAG_OPTIONS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(modal?.feature_flags || []).includes(key)}
                        onChange={(e) => setModal((p) => {
                          if (!p) return p
                          const flags = p.feature_flags || []
                          return { ...p, feature_flags: e.target.checked ? [...flags, key] : flags.filter(f => f !== key) }
                        })}
                        className="w-4 h-4 accent-brand-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={modal.is_active} onChange={(e) => setModal((p) => p ? { ...p, is_active: e.target.checked } : p)} className="w-4 h-4 accent-brand-600" />
                  Active (visible to buyers)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={modal.is_highlighted} onChange={(e) => setModal((p) => p ? { ...p, is_highlighted: e.target.checked } : p)} className="w-4 h-4 accent-brand-600" />
                  Highlighted (Most popular badge)
                </label>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm px-4 py-2">
                {saving ? 'Saving…' : modal.id ? 'Save changes' : 'Create plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
