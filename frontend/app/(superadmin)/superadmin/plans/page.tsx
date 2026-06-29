'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Plan {
  id?: number
  name: string
  slug: string
  billing_model: 'payg' | 'subscription'
  platform_fee_percent: string
  monthly_price: string
  annual_price: string
  allowed_payment_methods: string[]
  stripe_product_id: string
  stripe_price_id_monthly: string
  stripe_price_id_annual: string
  paypal_plan_id_monthly: string
  paypal_plan_id_annual: string
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
  { key: 'discounts', label: 'Discount codes' },
]

const PAYMENT_METHOD_OPTIONS = [
  { key: 'stripe', label: 'Stripe', sub: 'Card / digital wallet (Stripe Subscriptions)' },
  { key: 'gocardless', label: 'GoCardless', sub: 'Direct debit (UK preferred)' },
  { key: 'paypal', label: 'PayPal', sub: 'PayPal Subscriptions API' },
]

const EMPTY: Plan = {
  name: '', slug: '', billing_model: 'payg',
  platform_fee_percent: '2.00',
  monthly_price: '0', annual_price: '0',
  allowed_payment_methods: ['stripe'],
  stripe_product_id: '', stripe_price_id_monthly: '', stripe_price_id_annual: '',
  paypal_plan_id_monthly: '', paypal_plan_id_annual: '',
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
    setModal({
      ...p,
      feature_flags: p.feature_flags || [],
      allowed_payment_methods: p.allowed_payment_methods || ['stripe'],
    })
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
      allowed_payment_methods: modal.allowed_payment_methods || [],
      max_products: modal.max_products === null ? null : Number(modal.max_products),
      max_categories: modal.max_categories === null ? null : Number(modal.max_categories),
      max_staff: modal.max_staff === null ? null : Number(modal.max_staff),
    }
    try {
      if (modal.id) {
        await api.patch(`/api/subscriptions/plans/${modal.id}/`, payload)
      } else {
        await api.post('/api/subscriptions/plans/', payload)
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

  const set = <K extends keyof Plan>(key: K, val: Plan[K]) =>
    setModal((p) => p ? { ...p, [key]: val } : p)

  const textField = (key: keyof Plan, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={(modal?.[key] ?? '') as string}
        onChange={(e) => set(key, e.target.value as Plan[typeof key])}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  )

  const limitField = (key: 'max_products' | 'max_categories' | 'max_staff', label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-gray-400 font-normal">(blank = unlimited)</span>
      </label>
      <input
        type="number"
        min={0}
        value={modal?.[key] ?? ''}
        onChange={(e) => set(key, e.target.value === '' ? null : Number(e.target.value) as Plan[typeof key])}
        className="input-field"
        placeholder="Unlimited"
      />
    </div>
  )

  const isSubscription = modal?.billing_model === 'subscription'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-400 mt-0.5">Define what sellers get and how they pay for it.</p>
        </div>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Billing model</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pricing</th>
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
                    {p.is_highlighted && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">★ Popular</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.billing_model === 'payg' ? (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        PAYG {Number(p.platform_fee_percent).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                        Subscription
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">
                    {p.billing_model === 'payg'
                      ? `${Number(p.platform_fee_percent).toFixed(1)}% per transaction`
                      : `£${Number(p.monthly_price).toFixed(2)}/mo · £${Number(p.annual_price).toFixed(2)}/yr`}
                  </td>
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
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{modal.id ? 'Edit plan' : 'New plan'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Billing model — first choice */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Billing model</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'payg', title: 'PAYG', sub: '% taken from each transaction via Stripe Connect' },
                    { value: 'subscription', title: 'Subscription', sub: 'Monthly or annual recurring fee from seller' },
                  ].map(({ value, title, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('billing_model', value as 'payg' | 'subscription')}
                      className={`text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        modal.billing_model === value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-sm text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* PAYG fields */}
              {!isSubscription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform fee % <span className="text-gray-400 font-normal">(taken from each transaction)</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={modal.platform_fee_percent}
                    onChange={(e) => set('platform_fee_percent', e.target.value)}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">Seller also pays Stripe processing (1.5% + 20p for UK cards). Collected automatically via Stripe Connect application fee.</p>
                </div>
              )}

              {/* Subscription fields */}
              {isSubscription && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly price (£)</label>
                      <input type="number" step="0.01" value={modal.monthly_price} onChange={(e) => set('monthly_price', e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual price (£)</label>
                      <input type="number" step="0.01" value={modal.annual_price} onChange={(e) => set('annual_price', e.target.value)} className="input-field" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment methods sellers can use</label>
                    <div className="space-y-2">
                      {PAYMENT_METHOD_OPTIONS.map(({ key, label, sub }) => (
                        <label key={key} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-0.5 w-4 h-4 accent-brand-600"
                            checked={(modal.allowed_payment_methods || []).includes(key)}
                            onChange={(e) => {
                              const methods = modal.allowed_payment_methods || []
                              set('allowed_payment_methods', e.target.checked
                                ? [...methods, key]
                                : methods.filter((m) => m !== key))
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{label}</p>
                            <p className="text-xs text-gray-400">{sub}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {(modal.allowed_payment_methods || []).includes('stripe') && (
                    <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-blue-800">Stripe Subscription</p>
                        {modal.stripe_product_id
                          ? <span className="text-xs text-green-700 font-medium bg-green-100 px-2 py-0.5 rounded-full">✓ Synced to Stripe</span>
                          : <span className="text-xs text-blue-500">Auto-created on save</span>}
                      </div>
                      <p className="text-xs text-blue-600">
                        Stripe Products + Prices are created automatically when you save. Enter the monthly/annual prices above.
                      </p>
                      {modal.stripe_product_id && (
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-blue-700 mb-0.5">Product ID</p>
                            <p className="font-mono text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">{modal.stripe_product_id}</p>
                          </div>
                          {modal.stripe_price_id_monthly && (
                            <div>
                              <p className="text-xs font-medium text-blue-700 mb-0.5">Monthly Price ID</p>
                              <p className="font-mono text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">{modal.stripe_price_id_monthly}</p>
                            </div>
                          )}
                          {modal.stripe_price_id_annual && (
                            <div>
                              <p className="text-xs font-medium text-blue-700 mb-0.5">Annual Price ID</p>
                              <p className="font-mono text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">{modal.stripe_price_id_annual}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(modal.allowed_payment_methods || []).includes('paypal') && (
                    <div className="bg-yellow-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-yellow-800">PayPal Billing Plan IDs</p>
                      <p className="text-xs text-yellow-700">
                        In your PayPal dashboard → Subscriptions → Plans, create a plan for this tier (under any product name), then paste the Plan ID here (format: <code>P-xxx</code>).
                      </p>
                      {textField('paypal_plan_id_monthly', 'Monthly Plan ID', 'text', 'P-...')}
                      {textField('paypal_plan_id_annual', 'Annual Plan ID', 'text', 'P-...')}
                    </div>
                  )}
                </>
              )}

              <hr className="border-gray-100" />

              {/* Common fields */}
              {textField('name', 'Plan name')}
              {textField('slug', 'Slug (unique, e.g. starter)')}
              {textField('description', 'Description')}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features <span className="text-gray-400 font-normal">(display text for pricing page, one per line)</span>
                </label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="QR code ordering&#10;Live kitchen board&#10;Inventory management"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feature flags <span className="text-gray-400 font-normal">(unlocks app features)</span></label>
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

              <div className="grid grid-cols-3 gap-3">
                {limitField('max_products', 'Max products')}
                {limitField('max_categories', 'Max categories')}
                {limitField('max_staff', 'Max staff')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display order</label>
                  <input type="number" value={modal.display_order} onChange={(e) => set('display_order', Number(e.target.value))} className="input-field" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={modal.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 accent-brand-600" />
                  Active (visible to sellers)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={modal.is_highlighted} onChange={(e) => set('is_highlighted', e.target.checked)} className="w-4 h-4 accent-brand-600" />
                  Highlighted (Most popular badge)
                </label>
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
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
