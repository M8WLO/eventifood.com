'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

interface OrderItem {
  product_name: string
  variation_name: string
  quantity: number
}

interface Order {
  id: number
  order_number: string
  buyer_name: string
  status: string
  total: string
  items: OrderItem[]
  created_at: string
}

export default function BoardPage() {
  const [orders, setOrders] = useState<Order[]>([])

  const load = useCallback(() => {
    api.get('/api/orders/seller/?board=true').then((r) => setOrders(r.data))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  const updateStatus = async (id: number, status: string) => {
    await api.patch(`/api/orders/seller/${id}/status/`, { status })
    load()
  }

  const placed = orders.filter((o) => o.status === 'placed' || o.status === 'preparing')
  const ready = orders.filter((o) => o.status === 'ready')

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-2xl font-extrabold text-orange-400">Kitchen Board</h1>
        <div className="text-sm text-gray-400">Auto-refreshes every 10s</div>
      </header>
      <div className="flex-1 grid grid-cols-2 gap-0 divide-x divide-gray-700">
        {/* Preparing */}
        <div className="p-6 overflow-auto">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-widest">
            Preparing ({placed.length})
          </h2>
          <div className="space-y-4">
            {placed.map((o) => (
              <div key={o.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl font-extrabold text-white">{o.order_number}</span>
                  <span className="text-lg text-gray-300">{o.buyer_name}</span>
                </div>
                <ul className="text-base text-gray-200 space-y-1 mb-4">
                  {o.items.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold text-orange-400">{item.quantity}×</span>
                      <span>{item.product_name}</span>
                      <span className="text-gray-400">({item.variation_name})</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => updateStatus(o.id, 'ready')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-lg transition-colors"
                >
                  Mark Ready ✓
                </button>
              </div>
            ))}
            {placed.length === 0 && (
              <p className="text-gray-600 text-lg text-center pt-8">No orders preparing</p>
            )}
          </div>
        </div>

        {/* Ready */}
        <div className="p-6 overflow-auto bg-gray-850">
          <h2 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-widest">
            Ready ({ready.length})
          </h2>
          <div className="space-y-4">
            {ready.map((o) => (
              <div key={o.id} className="bg-green-900 rounded-xl p-5 border border-green-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl font-extrabold text-green-300">{o.order_number}</span>
                  <span className="text-lg text-green-200">{o.buyer_name}</span>
                </div>
                <ul className="text-base text-green-100 space-y-1 mb-4">
                  {o.items.map((item, i) => (
                    <li key={i}>{item.quantity}× {item.product_name} ({item.variation_name})</li>
                  ))}
                </ul>
                <button
                  onClick={() => updateStatus(o.id, 'collected')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Collected
                </button>
              </div>
            ))}
            {ready.length === 0 && (
              <p className="text-gray-600 text-lg text-center pt-8">No orders ready yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
