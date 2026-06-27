'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

interface OrderStatus {
  order_number: string
  status: string
  buyer_name: string
  created_at: string
  updated_at: string
}

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  placed: { emoji: '✅', label: 'Order placed!', color: 'text-blue-600' },
  preparing: { emoji: '🍳', label: 'Being prepared…', color: 'text-yellow-600' },
  ready: { emoji: '🎉', label: 'Ready for collection!', color: 'text-green-600' },
  collected: { emoji: '🙌', label: 'Collected — enjoy!', color: 'text-gray-500' },
}

export default function OrderStatusPage() {
  const params = useParams()
  const slug = params.slug as string
  const orderNumber = decodeURIComponent(params.orderNumber as string)

  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    api.defaults.headers.common['X-Tenant-Slug'] = slug
    api.get(`/api/orders/status/${encodeURIComponent(orderNumber)}/`)
      .then((r) => { setOrder(r.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [slug, orderNumber])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-gray-400">Loading order status…</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-600">Order not found.</p>
        </div>
      </div>
    )
  }

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="card max-w-sm w-full shadow-lg py-10 px-8">
        <div className="text-7xl mb-6">{config.emoji}</div>
        <h1 className={`text-2xl font-extrabold mb-2 ${config.color}`}>{config.label}</h1>
        <div className="bg-gray-50 rounded-xl px-6 py-4 mt-6 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order number</p>
          <p className="text-4xl font-extrabold text-gray-900 tracking-wider">{order.order_number}</p>
        </div>
        <p className="text-gray-500 text-sm mt-2">Hi {order.buyer_name}!</p>
        {order.status === 'ready' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-semibold">Please come to the counter to collect your order.</p>
          </div>
        )}
        {order.status !== 'collected' && (
          <p className="text-xs text-gray-400 mt-6">This page refreshes automatically.</p>
        )}
      </div>
    </div>
  )
}
