'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

interface OrderItem {
  product_name: string
  variation_name: string
  quantity: number
  subtotal: string
}

interface Order {
  id: number
  order_number: string
  buyer_name: string
  status: string
  total: string
  notes: string
  created_at: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  collected: 'Collected',
}

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  collected: 'bg-gray-100 text-gray-600',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    api.get('/api/orders/seller/?board=true')
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  const updateStatus = async (id: number, status: string) => {
    await api.patch(`/api/orders/seller/${id}/status/`, { status })
    load()
  }

  const placed = orders.filter((o) => o.status === 'placed' || o.status === 'preparing')
  const ready = orders.filter((o) => o.status === 'ready')

  if (loading) return <div className="p-8 text-gray-400">Loading orders…</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={() => window.open('/seller/orders/board', '_blank', 'width=1200,height=800')}
          className="btn-secondary text-sm"
        >
          Open as kitchen window ↗
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Placed / Preparing */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Placed / Preparing ({placed.length})
          </h2>
          <div className="space-y-3">
            {placed.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={updateStatus} nextStatus="ready" nextLabel="Mark ready ✓" />
            ))}
            {placed.length === 0 && <p className="text-gray-400 text-sm">No active orders</p>}
          </div>
        </div>
        {/* Ready */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ready ({ready.length})
          </h2>
          <div className="space-y-3">
            {ready.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={updateStatus} nextStatus="collected" nextLabel="Mark collected" />
            ))}
            {ready.length === 0 && <p className="text-gray-400 text-sm">No orders ready</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, onStatus, nextStatus, nextLabel }: {
  order: Order
  onStatus: (id: number, s: string) => void
  nextStatus: string
  nextLabel: string
}) {
  return (
    <div className="card border-l-4 border-orange-400">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-lg font-bold text-gray-900">{order.order_number}</span>
          <span className="ml-2 text-sm text-gray-500">{order.buyer_name}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>
      <ul className="text-sm text-gray-700 space-y-0.5 mb-3">
        {order.items.map((item, i) => (
          <li key={i}>{item.quantity}× {item.product_name} ({item.variation_name})</li>
        ))}
      </ul>
      {order.notes && <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded mb-2">Note: {order.notes}</p>}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">£{order.total}</span>
        <button
          onClick={() => onStatus(order.id, nextStatus)}
          className="btn-primary text-sm py-1 px-3"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
