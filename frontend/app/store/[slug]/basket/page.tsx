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
}

export default function BasketPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [basket, setBasket] = useState<BasketItem[]>([])
  const [form, setForm] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '', notes: '' })
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Retrieve basket from sessionStorage (set by storefront)
    const stored = sessionStorage.getItem('basket')
    if (stored) setBasket(JSON.parse(stored))
  }, [])

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
        items: basket.map((i) => ({ variation_id: i.variationId, quantity: i.quantity })),
      })
      sessionStorage.removeItem('basket')
      router.push(`/store/${slug}/order/${encodeURIComponent(data.order_number)}`)
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-8">
      <header className="bg-orange-500 text-white px-4 py-4 flex items-center gap-3">
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
                    <p className="text-xs text-gray-500">{item.variationName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(idx, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 flex items-center justify-center">−</button>
                      <span className="w-5 text-center font-semibold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(idx, item.quantity + 1)} className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold hover:bg-orange-200 flex items-center justify-center">+</button>
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
              <button type="submit" disabled={placing} className="btn-primary w-full py-3 text-base">
                {placing ? 'Placing order…' : `Place order · £${total.toFixed(2)}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
