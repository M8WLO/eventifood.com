'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface OrderItemExtra {
  id: number
  name: string
  additional_price: string
}

interface OrderItem {
  product_name: string
  variation_name: string
  quantity: number
  extras: OrderItemExtra[]
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

const NAV_MAP: Record<string, { href: string; label: string; icon: string }> = {
  dashboard:  { href: '/seller/dashboard',  label: 'Dashboard',  icon: '🏠' },
  menu:       { href: '/seller/menu',       label: 'Menu',       icon: '🍽️' },
  inventory:  { href: '/seller/inventory',  label: 'Inventory',  icon: '📦' },
  analytics:  { href: '/seller/analytics',  label: 'Analytics',  icon: '📊' },
  settings:   { href: '/seller/settings',   label: 'Settings',   icon: '⚙️' },
}

function BoardContent() {
  const searchParams = useSearchParams()
  const kiosk = searchParams.get('kiosk') === '1'

  const [orders, setOrders] = useState<Order[]>([])
  const [kitchenNav, setKitchenNav] = useState<string[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [historySearch, setHistorySearch] = useState('')

  const load = useCallback(() => {
    api.get('/api/orders/seller/?board=true').then((r) => setOrders(r.data))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)

    if (kiosk) {
      api.get('/api/tenants/mine/').then((r) => {
        setKitchenNav(r.data.kitchen_nav_items || [])
      }).catch(() => {})
    }

    return () => clearInterval(interval)
  }, [load, kiosk])

  const updateStatus = async (id: number, status: string) => {
    await api.patch(`/api/orders/seller/${id}/status/`, { status })
    load()
    if (historyOpen) {
      openHistory()
    }
  }

  const undoLastCollected = async () => {
    const res = await api.get('/api/orders/seller/')
    const allOrders: Order[] = res.data
    const lastCollected = allOrders
      .filter((o) => o.status === 'collected')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    if (lastCollected) {
      await updateStatus(lastCollected.id, 'ready')
    }
  }

  const openHistory = async () => {
    const res = await api.get('/api/orders/seller/')
    const all: Order[] = res.data
    setHistoryOrders(
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50)
    )
    setHistorySearch('')
    setHistoryOpen(true)
  }

  const placed = orders.filter((o) => o.status === 'placed' || o.status === 'preparing')
  const ready = orders.filter((o) => o.status === 'ready')

  const filteredHistory = historyOrders.filter(
    (o) =>
      !historySearch ||
      o.buyer_name.toLowerCase().includes(historySearch.toLowerCase()) ||
      o.order_number.includes(historySearch)
  )

  const showKioskSidebar = kiosk && kitchenNav.length > 0

  const outerClass = kiosk
    ? 'fixed inset-0 z-50 bg-gray-900 text-white flex'
    : 'min-h-screen bg-gray-900 text-white flex'

  return (
    <div className={outerClass}>
      {/* Kiosk sidebar — only when owner has enabled nav items */}
      {showKioskSidebar && (
        <aside className="w-48 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
          <div className="px-4 py-4 border-b border-gray-700">
            <span className="text-sm font-bold text-gray-300">Eventifood</span>
          </div>
          <nav className="flex-1 py-3 px-2 space-y-1">
            <Link
              href="/seller/orders/board?kiosk=1"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-gray-700 text-white"
            >
              <span>🍳</span> Kitchen
            </Link>
            {kitchenNav.map((key) => {
              const item = NAV_MAP[key]
              if (!item) return null
              return (
                <Link
                  key={key}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <span>{item.icon}</span> {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>
      )}

      {/* Board main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 shrink-0">
          <h1 className="text-xl font-extrabold text-brand-400">Kitchen Board</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={openHistory}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Order history
            </button>
            <button
              onClick={undoLastCollected}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Undo collected
            </button>
            <span className="text-xs text-gray-500">Auto-refreshes every 10s</span>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-2 gap-0 divide-x divide-gray-700 overflow-auto">
          {/* Preparing */}
          <div className="p-5 overflow-auto">
            <h2 className="text-lg font-bold text-yellow-400 mb-4 uppercase tracking-widest">
              Preparing ({placed.length})
            </h2>
            <div className="space-y-4">
              {placed.map((o) => (
                <div key={o.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-extrabold text-white">{o.order_number}</span>
                    <span className="text-lg text-gray-300">{o.buyer_name}</span>
                  </div>
                  <ul className="text-base text-gray-200 space-y-2 mb-4">
                    {o.items.map((item, i) => (
                      <li key={i}>
                        <div className="flex gap-2">
                          <span className="font-bold text-brand-400">{item.quantity}×</span>
                          <span>{item.product_name}</span>
                          {item.variation_name && item.variation_name !== 'Standard' && (
                            <span className="text-gray-400">({item.variation_name})</span>
                          )}
                        </div>
                        {item.extras?.length > 0 && (
                          <ul className="ml-6 mt-0.5 space-y-0.5">
                            {item.extras.map((e) => (
                              <li key={e.id} className="text-sm text-red-400 font-semibold">
                                {Number(e.additional_price) < 0 ? '−' : '+'} {e.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => updateStatus(o.id, 'ready')}
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3 rounded-xl text-xl transition-colors"
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
          <div className="p-5 overflow-auto">
            <h2 className="text-lg font-bold text-green-400 mb-4 uppercase tracking-widest">
              Ready ({ready.length})
            </h2>
            <div className="space-y-4">
              {ready.map((o) => (
                <div key={o.id} className="bg-green-900 rounded-xl p-5 border border-green-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-extrabold text-green-300">{o.order_number}</span>
                    <span className="text-lg text-green-200">{o.buyer_name}</span>
                  </div>
                  <ul className="text-base text-green-100 space-y-2 mb-4">
                    {o.items.map((item, i) => (
                      <li key={i}>
                        <span>
                          {item.quantity}× {item.product_name}
                          {item.variation_name && item.variation_name !== 'Standard'
                            ? ` (${item.variation_name})`
                            : ''}
                        </span>
                        {item.extras?.length > 0 && (
                          <ul className="ml-4 mt-0.5">
                            {item.extras.map((e) => (
                              <li key={e.id} className="text-sm text-red-400 font-semibold">
                                {Number(e.additional_price) < 0 ? '−' : '+'} {e.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => updateStatus(o.id, 'collected')}
                    className="w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white font-semibold py-3 rounded-xl text-lg transition-colors"
                  >
                    Collected ✓
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

      {/* Order history modal */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: '75vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
              <h3 className="text-xl font-bold text-white">Order history (last 50)</h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-3 border-b border-gray-700 shrink-0">
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search by name or order number…"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-gray-400"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-scroll px-6 py-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {filteredHistory.map((o) => (
                <div
                  key={o.id}
                  className="bg-gray-800 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg font-extrabold text-white shrink-0">{o.order_number}</span>
                      <span className="text-gray-300 font-medium truncate">{o.buyer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-white">£{Number(o.total).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        o.status === 'collected' ? 'bg-gray-600 text-gray-300' :
                        o.status === 'ready'     ? 'bg-green-800 text-green-300' :
                                                   'bg-yellow-800 text-yellow-300'
                      }`}>
                        {o.status}
                      </span>
                      {o.status === 'collected' && (
                        <button
                          onClick={() => updateStatus(o.id, 'ready')}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Undo ↩
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-0">
                    {o.items.map((i) => `${i.quantity}× ${i.product_name}`).join(', ')}
                  </p>
                </div>
              ))}
              {filteredHistory.length === 0 && (
                <p className="text-gray-600 text-center py-8">No orders found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BoardPage() {
  return (
    <Suspense>
      <BoardContent />
    </Suspense>
  )
}
