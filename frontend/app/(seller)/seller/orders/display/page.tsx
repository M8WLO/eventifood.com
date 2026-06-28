'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

interface Order {
  id: number
  order_number: string
  daily_number?: number
  status: string
}

function displayNumber(o: Order, mode: string): string {
  if (mode === 'daily' && o.daily_number != null)
    return `#${String(o.daily_number).padStart(4, '0')}`
  return o.order_number.startsWith('#') ? o.order_number : `#${o.order_number}`
}

export default function CustomerDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [orderMode, setOrderMode] = useState('daily')
  const [storeName, setStoreName] = useState('')

  const load = useCallback(() => {
    api.get('/api/orders/seller/?board=true').then((r) => {
      setOrders(r.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/api/tenants/mine/').then((r) => {
      setStoreName(r.data.name || '')
      setOrderMode(r.data.order_number_mode || 'daily')
    }).catch(() => {})

    load()
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [load])

  const received  = orders.filter((o) => o.status === 'placed')
  const preparing = orders.filter((o) => o.status === 'preparing')
  const ready     = orders.filter((o) => o.status === 'ready')

  const col = (
    title: string,
    items: Order[],
    accent: string,
    numberClass: string,
    bg: string,
  ) => (
    <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800 last:border-r-0">
      <div className={`px-6 py-5 border-b border-gray-800 ${accent}`}>
        <h2 className="text-xl font-bold tracking-wide uppercase">{title}</h2>
        <p className="text-sm opacity-60 mt-0.5">{items.length} order{items.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-700 text-sm">None</div>
        ) : (
          <div className="flex flex-wrap gap-3 content-start">
            {items.map((o) => (
              <div
                key={o.id}
                className={`${bg} rounded-2xl flex items-center justify-center font-extrabold tabular-nums shadow-lg`}
                style={{ width: 150, height: 120, fontSize: 34 }}
              >
                <span className={numberClass}>{displayNumber(o, orderMode)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-[#0a0a14] text-white flex flex-col select-none overflow-hidden">
      {/* Header */}
      <header className="px-8 py-4 bg-[#111120] border-b border-gray-800 flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-extrabold tracking-tight">{storeName || 'Orders'}</h1>
        <p className="text-xs text-gray-600">Updates every 8 seconds</p>
      </header>

      {/* 3 columns */}
      <div className="flex-1 flex overflow-hidden">
        {col(
          'Order received',
          received,
          'text-gray-400',
          'text-gray-300',
          'bg-gray-800',
        )}
        {col(
          'Being prepared',
          preparing,
          'text-orange-400',
          'text-orange-300',
          'bg-orange-900/40',
        )}
        {col(
          'Ready for collection',
          ready,
          'text-green-400',
          'text-green-300',
          'bg-green-900/50',
        )}
      </div>

      {/* Footer */}
      <footer className="px-8 py-3 bg-[#111120] border-t border-gray-800 text-center shrink-0">
        <p className="text-gray-600 text-sm">Please collect your order from the counter when your number appears in the green column</p>
      </footer>
    </div>
  )
}
