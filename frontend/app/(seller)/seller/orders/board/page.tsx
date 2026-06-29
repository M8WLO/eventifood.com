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

const PREV_STATUS: Record<string, string> = {
  preparing: 'placed',
  ready: 'preparing',
  collected: 'ready',
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
  if (mode === 'daily' && o.daily_number != null)
    return `#${String(o.daily_number).padStart(4, '0')}`
  return o.order_number.startsWith('#') ? o.order_number : `#${o.order_number}`
}

function BoardContent() {
  const searchParams = useSearchParams()
  const kiosk = searchParams.get('kiosk') === '1'

  const [orders, setOrders] = useState<Order[]>([])
  const [kitchenNav, setKitchenNav] = useState<string[]>([])
  const [orderMode, setOrderMode] = useState<string>('daily')
  const [advancing, setAdvancing] = useState<Set<number>>(new Set())
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

        {/* Order columns */}
        <div className="flex-1 overflow-hidden flex gap-0">
          {(['placed', 'preparing', 'ready'] as const).map((colStatus) => {
            const colOrders = active.filter((o) => o.status === colStatus)
            const colCfg = STATUS_CONFIG[colStatus]
            const colColors: Record<string, { header: string; ring: string; badge: string }> = {
              placed:    { header: 'border-green-500/40 bg-green-500/5', ring: 'ring-1 ring-green-500/20', badge: 'bg-green-500/20 text-green-300' },
              preparing: { header: 'border-orange-500/40 bg-orange-500/5', ring: 'ring-1 ring-orange-500/20', badge: 'bg-orange-500/20 text-orange-300' },
              ready:     { header: 'border-purple-500/40 bg-purple-500/5', ring: 'ring-1 ring-purple-500/20', badge: 'bg-purple-500/20 text-purple-300' },
            }
            const cc = colColors[colStatus]
            return (
              <div key={colStatus} className="flex-1 min-w-0 flex flex-col border-r border-gray-800 last:border-r-0">
                {/* Column header */}
                <div className={`shrink-0 px-4 py-3 border-b ${cc.header} flex items-center justify-between`}>
                  <span className="font-bold text-sm text-white">
                    {colStatus === 'placed' ? 'New' : colStatus === 'preparing' ? 'Preparing' : 'Ready'}
                  </span>
                  {colOrders.length > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cc.badge}`}>
                      {colOrders.length}
                    </span>
                  )}
                </div>
                {/* Column body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-gray-700 text-sm">
                      —
                    </div>
                  ) : colOrders.map((o) => {
                    const isAdvancing = advancing.has(o.id)
                    return (
                      <div
                        key={o.id}
                        className={`bg-[#1e1e30] rounded-2xl p-4 flex flex-col gap-3 transition-opacity ${isAdvancing ? 'opacity-50' : ''} ${cc.ring}`}
                      >
                        <div className="text-xs text-gray-500 font-medium">
                          {displayNumber(o, orderMode)}
                          {o.buyer_name && <span className="ml-2 text-gray-600">· {o.buyer_name}</span>}
                        </div>
                        <ul className="space-y-0.5">
                          {o.items.map((item, i) => (
                            <li key={i} className="text-white text-sm font-medium">
                              {item.product_name}{' '}
                              <span className="text-gray-400">×{item.quantity}</span>
                              {item.variation_name && item.variation_name !== 'Standard' && (
                                <span className="text-gray-500 text-xs ml-1">({item.variation_name})</span>
                              )}
                              {item.extras?.length > 0 && (
                                <ul className="ml-3 mt-0.5">
                                  {item.extras.map((e) => (
                                    <li key={e.id} className="text-xs text-red-400 font-medium">
                                      {Number(e.additional_price) < 0 ? '−' : '+'} {e.name}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
                          {PREV_STATUS[colStatus] && (
                            <button
                              onClick={() => setStatus(o, PREV_STATUS[colStatus])}
                              disabled={isAdvancing}
                              className="text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 px-2 py-1 rounded-lg transition-all"
                            >
                              ↩ Undo
                            </button>
                          )}
                          <div className="flex-1" />
                          {colStatus === 'ready' ? (
                            <button
                              onClick={() => setStatus(o, 'collected')}
                              disabled={isAdvancing}
                              className="px-4 py-1.5 rounded-full font-semibold text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 transition-all active:scale-95"
                            >
                              Collected ✓
                            </button>
                          ) : (
                            <button
                              onClick={() => advanceStatus(o)}
                              disabled={isAdvancing}
                              className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 ${colCfg.color}`}
                            >
                              {colCfg.nextLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
                      {PREV_STATUS[o.status] && (
                        <button
                          onClick={async () => {
                            await api.patch(`/api/orders/seller/${o.id}/status/`, { status: PREV_STATUS[o.status] })
                            openHistory()
                          }}
                          className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          ↩ Undo
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
