'use client'

import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'

interface BasketItem {
  variationId: number
  productName: string
  variationName: string
  price: number
  quantity: number
  extras: { id: number; name: string; additional_price: number }[]
}

const THEME_COLORS: Record<string, { primary: string; dark: string }> = {
  default: { primary: '#7B21B6', dark: '#581584' },
  sunset:  { primary: '#e11d48', dark: '#be123c' },
  ocean:   { primary: '#0891b2', dark: '#0e7490' },
  forest:  { primary: '#16a34a', dark: '#15803d' },
  amber:   { primary: '#d97706', dark: '#b45309' },
  coral:   { primary: '#ea580c', dark: '#c2410c' },
  ruby:    { primary: '#dc2626', dark: '#b91c1c' },
  teal:    { primary: '#0d9488', dark: '#0f766e' },
  indigo:  { primary: '#4f46e5', dark: '#4338ca' },
  navy:    { primary: '#1d4ed8', dark: '#1e40af' },
  pink:    { primary: '#db2777', dark: '#be185d' },
  slate:   { primary: '#475569', dark: '#334155' },
}

export default function BasketPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [basket, setBasket] = useState<BasketItem[]>([])
  const [theme, setTheme] = useState('default')
  const [isDemo, setIsDemo] = useState(false)
  const [paymentMode, setPaymentMode] = useState('payg')
  const [paypalAvailable, setPaypalAvailable] = useState(false)
  const [form, setForm] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '', notes: '' })
  const [placing, setPlacing] = useState(false)
  const [placingPaypal, setPlacingPaypal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Discount state
  const [discountInput, setDiscountInput] = useState('')
  const [discountValidating, setDiscountValidating] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: string
    discount_amount: string
  } | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('basket')
    if (stored) setBasket(JSON.parse(stored))
    const t = sessionStorage.getItem(`ef_theme_${slug}`) || 'default'
    setTheme(t)
    setIsDemo(sessionStorage.getItem(`ef_demo_${slug}`) === '1')
    setPaymentMode(sessionStorage.getItem(`ef_payment_mode_${slug}`) || 'payg')
    setPaypalAvailable(sessionStorage.getItem(`ef_paypal_${slug}`) === '1')
  }, [slug])

  useEffect(() => {
    if (basket.length > 0) {
      sessionStorage.setItem('basket', JSON.stringify(basket))
    } else {
      sessionStorage.removeItem('basket')
    }
  }, [basket])

  const colors = THEME_COLORS[theme] || THEME_COLORS.default

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) {
      setBasket((prev) => prev.filter((_, i) => i !== idx))
    } else {
      setBasket((prev) => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
    }
  }

  const rawTotal = basket.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountAmount = appliedDiscount ? parseFloat(appliedDiscount.discount_amount) : 0
  const total = Math.max(rawTotal - discountAmount, 0.01)

  const applyDiscount = async () => {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setDiscountValidating(true)
    setDiscountError(null)
    setAppliedDiscount(null)
    api.defaults.headers.common['X-Tenant-Slug'] = slug
    try {
      const { data } = await api.post('/api/discounts/validate/', { code, total: rawTotal.toFixed(2) })
      if (data.valid) {
        setAppliedDiscount(data)
        setDiscountInput('')
      } else {
        setDiscountError(data.detail || 'Invalid discount code.')
      }
    } catch {
      setDiscountError('Could not validate code. Please try again.')
    } finally {
      setDiscountValidating(false)
    }
  }

  const removeDiscount = () => {
    setAppliedDiscount(null)
    setDiscountError(null)
    setDiscountInput('')
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (basket.length === 0) return
    setError(null)
    flushSync(() => setPlacing(true))
    api.defaults.headers.common['X-Tenant-Slug'] = slug
    try {
      if (isDemo) {
        // Demo mode: place order directly without payment
        const { data } = await api.post('/api/orders/place/', {
          ...form,
          discount_code: appliedDiscount?.code || '',
          items: basket.map((i) => ({ variation_id: i.variationId, quantity: i.quantity, extras: i.extras.map(e => e.id) })),
        })
        sessionStorage.removeItem('basket')
        const lsKey = `ef_orders_${slug}`
        const existing: string[] = JSON.parse(localStorage.getItem(lsKey) || '[]')
        if (!existing.includes(data.order_number)) {
          existing.push(data.order_number)
          localStorage.setItem(lsKey, JSON.stringify(existing))
        }
        router.push(`/store/${slug}/order/${encodeURIComponent(data.order_number)}`)
      } else {
        // Live mode: create Stripe Checkout Session and redirect
        const { data } = await api.post('/api/payments/checkout/', {
          ...form,
          discount_code: appliedDiscount?.code || '',
          items: basket.map((i) => ({ variation_id: i.variationId, quantity: i.quantity, extras: i.extras.map(e => e.id) })),
        })
        sessionStorage.removeItem('basket')
        const lsKey = `ef_orders_${slug}`
        const existing: string[] = JSON.parse(localStorage.getItem(lsKey) || '[]')
        if (!existing.includes(data.order_number)) {
          existing.push(data.order_number)
          localStorage.setItem(lsKey, JSON.stringify(existing))
        }
        window.location.href = data.url
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const placeOrderPayPal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (basket.length === 0) return
    setError(null)
    flushSync(() => setPlacingPaypal(true))
    api.defaults.headers.common['X-Tenant-Slug'] = slug
    try {
      const { data } = await api.post('/api/payments/paypal/create/', {
        ...form,
        discount_code: appliedDiscount?.code || '',
        items: basket.map((i) => ({ variation_id: i.variationId, quantity: i.quantity, extras: i.extras.map(e => e.id) })),
      })
      // Track order number before redirect (in case redirect fails)
      const lsKey = `ef_orders_${slug}`
      const existing: string[] = JSON.parse(localStorage.getItem(lsKey) || '[]')
      if (!existing.includes(data.order_number)) {
        existing.push(data.order_number)
        localStorage.setItem(lsKey, JSON.stringify(existing))
      }
      sessionStorage.removeItem('basket')
      window.location.href = data.approval_url
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to start PayPal checkout. Please try again.')
    } finally {
      setPlacingPaypal(false)
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isDemo ? 'pb-16' : 'pb-8'}`}>
      <header style={{ backgroundColor: colors.primary }} className="text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white text-xl">←</button>
        <h1 className="text-lg font-bold">Your basket</h1>
      </header>

      {isDemo && (
        <div className="bg-orange-500 text-white text-center text-xs font-semibold py-2 px-4">
          Demo store — this is a test environment, no payments will be taken
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {basket.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🛒</p>
            <p>Your basket is empty</p>
          </div>
        ) : (
          <>
            <div className="card space-y-3">
              {basket.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                    {item.variationName && item.variationName !== 'Standard' && (
                      <p className="text-xs text-gray-500">{item.variationName}</p>
                    )}
                    {item.extras?.length > 0 && (
                      <p className="text-xs text-gray-400">{item.extras.map(e => e.name).join(', ')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(idx, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 flex items-center justify-center">−</button>
                      <span className="w-5 text-center font-semibold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(idx, item.quantity + 1)} style={{ backgroundColor: colors.primary + '20', color: colors.primary }} className="w-7 h-7 rounded-full font-bold flex items-center justify-center hover:opacity-80">+</button>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-16 text-right">
                      £{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {appliedDiscount && (
                <div className="border-t border-dashed border-gray-100 pt-3 flex justify-between text-sm text-green-700">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span>−£{parseFloat(appliedDiscount.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Discount code input */}
            <div className="card">
              {appliedDiscount ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        {appliedDiscount.code} applied —{' '}
                        {appliedDiscount.discount_type === 'percentage'
                          ? `${Number(appliedDiscount.discount_value).toFixed(0)}% off`
                          : `£${Number(appliedDiscount.discount_value).toFixed(2)} off`}
                      </p>
                      <p className="text-xs text-green-600">You save £{parseFloat(appliedDiscount.discount_amount).toFixed(2)}</p>
                    </div>
                  </div>
                  <button onClick={removeDiscount} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Have a discount code?</p>
                  <div className="flex gap-2">
                    <input
                      value={discountInput}
                      onChange={(e) => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(null) }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyDiscount())}
                      className="input-field flex-1 font-mono uppercase text-sm"
                      placeholder="Enter code"
                      maxLength={50}
                    />
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={discountValidating || !discountInput.trim()}
                      style={{ backgroundColor: colors.primary }}
                      className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
                    >
                      {discountValidating ? '…' : 'Apply'}
                    </button>
                  </div>
                  {discountError && <p className="text-red-500 text-xs mt-1.5">{discountError}</p>}
                </div>
              )}
            </div>

            <form onSubmit={placeOrder} className="card space-y-4">
              <h2 className="font-semibold text-gray-800">Your details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required value={form.buyer_name} onChange={(e) => setForm((p) => ({ ...p, buyer_name: e.target.value }))} className="input-field" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={form.buyer_email} onChange={(e) => setForm((p) => ({ ...p, buyer_email: e.target.value }))} className="input-field" placeholder="jane@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input type="tel" value={form.buyer_phone} onChange={(e) => setForm((p) => ({ ...p, buyer_phone: e.target.value }))} className="input-field" placeholder="+44 7700 900000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="input-field" rows={2} placeholder="Allergies, special requests…" />
              </div>
              {isDemo && (
                <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Demo payment details</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Card number</label>
                    <input readOnly value="4242 4242 4242 4242" className="input-field font-mono text-sm bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Expiry</label>
                      <input readOnly value="12 / 34" className="input-field font-mono text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CVC</label>
                      <input readOnly value="123" className="input-field font-mono text-sm bg-white" />
                    </div>
                  </div>
                  <p className="text-xs text-orange-600">No payment will be charged. This is demo data.</p>
                </div>
              )}
              {!isDemo && paymentMode === 'own' && (
                <p className="text-xs text-gray-400 text-center">
                  Card payments are processed by Stripe. A card processing fee (1.5% + 20p for UK cards) is charged by Stripe on card payments.
                </p>
              )}
              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={placing || placingPaypal} style={{ backgroundColor: isDemo ? '#f97316' : colors.primary }} className="w-full py-3 text-base text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {placing
                  ? 'Please wait…'
                  : isDemo
                  ? `Place demo order · £${total.toFixed(2)}`
                  : `Pay by card · £${total.toFixed(2)}`}
              </button>

              {/* PayPal button — shown whenever the store has PayPal configured */}
              {paypalAvailable && (
                <button
                  type="button"
                  onClick={placeOrderPayPal}
                  disabled={placing || placingPaypal}
                  className="w-full py-3 text-base font-semibold rounded-lg transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#FFC439', color: '#003087' }}
                >
                  {placingPaypal ? 'Please wait…' : (
                    <>
                      <span className="font-extrabold">Pay</span>
                      <span style={{ color: '#009cde', fontWeight: 800 }}>Pal</span>
                      <span>· £{total.toFixed(2)}</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </>
        )}
      </div>

      {isDemo && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-500 text-white text-center text-xs font-semibold py-2 px-4">
          Demo store — this is a test environment, no payments will be taken
        </div>
      )}
    </div>
  )
}
