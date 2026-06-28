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
  daily_number?: number
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
  wastage:    { href: '/seller/wastage',    label: 'Wastage',    icon: '🗑️' },
  analytics:  { href: '/seller/analytics',  label: 'Analytics',  icon: '📊' },
  settings:   { href: '/seller/settings',   label: 'Settings',   icon: '⚙️' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; next: string; nextLabel: string }> = {
  placed: {
    label: 'New',
    color: 'bg-green-500 hover:bg-green-400 text-white',
    next: 'preparing',
    nextLabel: 'Start preparing',
  },
  preparing: {
    label: 'Preparing',
    color: 'bg-orange-500 hover:bg-orange-400 text-white',
    next: 'ready',
    nextLabel: 'Mark ready',
  },
  ready: {
    label: 'Ready',
    color: 'bg-purple-600 hover:bg-purple-500 text-white',
    next: 'collected',
    nextLabel: 'Mark collected',
  },
}

function displayNumber(o: Order, mode: string): string {
  if (mode === 'daily' && o.daily_number != null) return `#${o.daily_number}`
  return o.order_number
}

function BoardContent() {
  const searchParams = useSearchParams()
  const kiosk = searchParams.get('kiosk') === '1'

  const [orders, setOrders] = useState<Order[]>([])
  const [kitchenNav, setKitchenNav] = useState<string[]>([])
  const [orderMode, setOrderMode] = useState<string>('daily')
  const [advancing, setAdvancing] = useState<Set<number>>(new Set())
  const [undoConfirm, setUndoConfirm] = useState<Order | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [historySearch, setHistorySearch] = useState('')

  const load = useCallback(() => {
    api.get('/api/orders/seller/?board=true').then((r) => setOrders(r.data))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)

    api.get('/api/tenants/mine/').then((r) => {
      setKitchenNav(r.data.kitchen_nav_items || [])
      setOrderMode(r.data.order_number_mode || 'daily')
    }).catch(() => {})

    return () => clearInterval(interval)
  }, [load])

  const setStatus = async (order: Order, newStatus: string) => {
    setAdvancing((prev) => new Set(prev).add(order.id))
    try {
      await api.patch(`/api/orders/seller/${order.id}/status/`, { status: newStatus })
      load()
    } finally {
      setAdvancing((prev) => {
        const next = new Set(prev)
        next.delete(order.id)
        return next
      })
    }
  }

  const advanceStatus = async (order: Order) => {
    const cfg = STATUS_CONFIG[order.status]
    if (!cfg) return
    await setStatus(order, cfg.next)
  }

  const undoLastCollected = async () => {
    const res = await api.get('/api/orders/seller/')
    const all: Order[] = res.data
    const last = all
      .filter((o) => o.status === 'collected')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    if (last) {
      await api.patch(`/api/orders/seller/${last.id}/status/`, { status: 'ready' })
      load()
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

  const active = orders.filter((o) => o.status !== 'collected')
  const showKioskSidebar = kiosk && kitchenNav.length > 0
  const outerClass = kiosk
    ? 'fixed inset-0 z-50 bg-[#0f0f1a] text-white flex'
    : 'min-h-screen bg-[#0f0f1a] text-white flex'

  const filteredHistory = historyOrders.filter(
    (o) =>
      !historySearch ||
      o.buyer_name.toLowerCase().includes(historySearch.toLowerCase()) ||
      o.order_number.includes(historySearch) ||
      String(o.daily_number ?? '').includes(historySearch)
  )

  return (
    <div className={outerClass}>
      {/* Kiosk sidebar */}
      {showKioskSidebar && (
        <aside className="w-48 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="px-4 py-4 border-b border-gray-800">
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
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-[#16162a] border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold text-white">Kitchen Board — Live Orders</h1>
            <span className="flex items-center gap-1.5 text-sm text-green-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
              {active.length} active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open('/seller/orders/display', '_blank')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Customer display ↗
            </button>
            <button
              onClick={openHistory}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              History
            </button>
            <button
              onClick={undoLastCollected}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Undo
            </button>
            <span className="text-xs text-gray-600">Refreshes every 10s</span>
          </div>
        </header>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto p-5">
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-700 gap-3">
              <span className="text-5xl">🍳</span>
              <p className="text-xl font-semibold">No active orders</p>
              <p className="text-sm">New orders will appear here automatically</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-3">
              {active.map((o) => {
                const cfg = STATUS_CONFIG[o.status]
                const isAdvancing = advancing.has(o.id)
                return (
                  <div
                    key={o.id}
                    className={`bg-[#1e1e30] rounded-2xl p-5 flex flex-col gap-3 transition-opacity ${
                      isAdvancing ? 'opacity-50' : ''
                    } ${o.status === 'placed' ? 'ring-1 ring-green-500/30' : ''}`}
                  >
                    {/* Top row: order details + status badge */}
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: number + items */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 font-medium mb-1">
                          {displayNumber(o, orderMode)}
                          {o.buyer_name && (
                            <span className="ml-2 text-gray-600">· {o.buyer_name}</span>
                          )}
                        </div>
                        <ul className="space-y-0.5">
                          {o.items.map((item, i) => (
                            <li key={i} className="text-white text-base font-medium">
                              {item.product_name}{' '}
                              <span className="text-gray-400">×{item.quantity}</span>
                              {item.variation_name && item.variation_name !== 'Standard' && (
                                <span className="text-gray-500 text-sm ml-1">({item.variation_name})</span>
                              )}
                              {item.extras?.length > 0 && (
                                <ul className="ml-4 mt-0.5 space-y-0">
                                  {item.extras.map((e) => (
                                    <li key={e.id} className="text-sm text-red-400 font-medium">
                                      {Number(e.additional_price) < 0 ? '−' : '+'} {e.name}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: status badge only */}
                      {cfg && (
                        <button
                          onClick={() => o.status === 'ready' ? setUndoConfirm(o) : advanceStatus(o)}
                          disabled={isAdvancing}
                          className={`shrink-0 px-5 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${cfg.color}`}
                          title={o.status === 'ready' ? 'Move back to Preparing' : cfg.nextLabel}
                        >
                          {cfg.label}
                        </button>
                      )}
                    </div>

                    {/* Bottom row: collected button centred, only for ready orders */}
                    {o.status === 'ready' && (
                      <div className="flex justify-center pt-1 border-t border-gray-700/50">
                        <button
                          onClick={() => setStatus(o, 'collected')}
                          disabled={isAdvancing}
                          className="px-6 py-2 rounded-full font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 transition-all active:scale-95"
                        >
                          Collected ✓
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Undo-ready confirmation modal */}
      {undoConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <p className="text-2xl mb-3">⚠️</p>
            <h3 className="text-xl font-bold text-white mb-2">Move back to Preparing?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Order {displayNumber(undoConfirm, orderMode)} will be moved back to&nbsp;
              <span className="text-orange-400 font-semibold">Preparing</span>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUndoConfirm(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const order = undoConfirm
                  setUndoConfirm(null)
                  await setStatus(order, 'preparing')
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors"
              >
                Yes, move back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
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
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {filteredHistory.map((o) => (
                <div key={o.id} className="bg-gray-800 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base font-extrabold text-white shrink-0">{displayNumber(o, orderMode)}</span>
                      <span className="text-gray-300 font-medium truncate">{o.buyer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-white">£{Number(o.total).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        o.status === 'collected' ? 'bg-gray-600 text-gray-300' :
                        o.status === 'ready'     ? 'bg-purple-800 text-purple-300' :
                        o.status === 'preparing' ? 'bg-orange-800 text-orange-300' :
                                                   'bg-green-800 text-green-300'
                      }`}>
                        {o.status === 'placed' ? 'New' : o.status}
                      </span>
                      {o.status === 'collected' && (
                        <button
                          onClick={async () => {
                            await api.patch(`/api/orders/seller/${o.id}/status/`, { status: 'ready' })
                            openHistory()
                          }}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Undo ↩
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
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
