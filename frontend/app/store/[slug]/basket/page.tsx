'use client'

import { useState, useEffect } from 'react'
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
}

export default function BasketPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [basket, setBasket] = useState<BasketItem[]>([])
  const [theme, setTheme] = useState('default')
  const [form, setForm] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '', notes: '' })
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('basket')
    if (stored) setBasket(JSON.parse(stored))
    const t = sessionStorage.getItem(`ef_theme_${slug}`) || 'default'
    setTheme(t)
  }, [slug])

  const colors = THEME_COLORS[theme] || THEME_COLORS.default

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) {
      setBasket((prev) => prev.filter((_, i) => i !== idx))
    } else {
      setBasket((prev) => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
    }
  }

  const total = basket.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (basket.length === 0) return
    setError(null)
    setPlacing(true)
    api.defaults.headers.common['X-Tenant-Slug'] = slug
    try {
      const { data } = await api.post('/api/orders/place/', {
        ...form,
        items: basket.map((i) => ({ variation_id: i.variationId, quantity: i.quantity, extras: i.extras.map(e => e.id) })),
      })
      sessionStorage.removeItem('basket')
      // Track all order numbers placed from this device for this vendor
      const lsKey = `ef_orders_${slug}`
      const existing: string[] = JSON.parse(localStorage.getItem(lsKey) || '[]')
      if (!existing.includes(data.order_number)) {
        existing.push(data.order_number)
        localStorage.setItem(lsKey, JSON.stringify(existing))
      }
      router.push(`/store/${slug}/order/${encodeURIComponent(data.order_number)}`)
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header style={{ backgroundColor: colors.primary }} className="text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white text-xl">←</button>
        <h1 className="text-lg font-bold">Your basket</h1>
      </header>

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
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
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
              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={placing} style={{ backgroundColor: colors.primary }} className="w-full py-3 text-base text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {placing ? 'Placing order…' : `Place order · £${total.toFixed(2)}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
