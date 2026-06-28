'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface OrderStatus {
  order_number: string
  daily_number: number | null
  status: string
  buyer_name: string
  created_at: string
  updated_at: string
}

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  placed:    { emoji: '✅', label: 'Order placed!',         color: 'text-blue-600' },
  preparing: { emoji: '🍳', label: 'Being prepared…',       color: 'text-yellow-600' },
  ready:     { emoji: '🎉', label: 'Ready for collection!', color: 'text-green-600' },
  collected: { emoji: '🙌', label: 'Collected — enjoy!',    color: 'text-gray-500' },
}

export default function OrderStatusPage() {
  const params = useParams()
  const slug = params.slug as string
  const orderNumber = decodeURIComponent(params.orderNumber as string)

  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [otherOrders, setOtherOrders] = useState<OrderStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [soundReady, setSoundReady] = useState(false)

  const prevStatus = useRef<string | null>(null)
  const prevOtherStatuses = useRef<Record<string, string>>({})
  // Holds an unlocked AudioContext after the user taps "Enable alerts"
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playAlert = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      // Resume in case it was suspended
      ctx.resume().then(() => {
        const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
        let t = ctx.currentTime
        notes.forEach((freq) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.type = 'triangle'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.45, t)
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
          osc.start(t)
          osc.stop(t + 0.3)
          t += 0.14
        })
      })
    } catch { /* silent fail */ }
  }, [])

  // Must be called inside a synchronous user-gesture handler
  const enableSound = () => {
    if (audioCtxRef.current) return
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtxClass()
      // Play a silent buffer to unlock iOS
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start(0)
      audioCtxRef.current = ctx
      setSoundReady(true)
      // Play the fanfare immediately so they know it worked
      setTimeout(playAlert, 50)
    } catch { /* audio not available */ }
  }

  const load = useCallback(() => {
    api.defaults.headers.common['X-Tenant-Slug'] = slug
    api.get(`/api/orders/status/${encodeURIComponent(orderNumber)}/`)
      .then((r) => {
        const newStatus: string = r.data.status
        if (prevStatus.current !== null && prevStatus.current !== 'ready' && newStatus === 'ready') {
          playAlert()
        }
        prevStatus.current = newStatus
        setOrder(r.data)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })

    // Load other orders placed from this device
    try {
      const lsKey = `ef_orders_${slug}`
      const stored: string[] = JSON.parse(localStorage.getItem(lsKey) || '[]')
      const others = stored.filter((n) => n !== orderNumber)
      if (others.length > 0) {
        Promise.all(
          others.map((n) =>
            api.get(`/api/orders/status/${encodeURIComponent(n)}/`).then((r) => r.data).catch(() => null)
          )
        ).then((results) => {
          const valid = results.filter(Boolean) as OrderStatus[]
          // Fire alert if any other order just became ready
          valid.forEach((o) => {
            const prev = prevOtherStatuses.current[o.order_number]
            if (prev && prev !== 'ready' && o.status === 'ready') {
              playAlert()
            }
            prevOtherStatuses.current[o.order_number] = o.status
          })
          setOtherOrders(valid)
        })
      }
    } catch { /* localStorage not available */ }
  }, [slug, orderNumber, playAlert])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading order status…</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-600">Order not found.</p>
        </div>
      </div>
    )
  }

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed
  const readyOthers = otherOrders.filter((o) => o.status === 'ready')
  // All order numbers ready for collection right now (including this one)
  const allReadyNumbers =
    order.status === 'ready'
      ? [order, ...readyOthers]
      : readyOthers

  // Display number: prefer daily_number (matches kitchen display), fall back to order_number
  const displayNum = (o: OrderStatus) =>
    o.daily_number != null ? String(o.daily_number) : o.order_number

  const hasOtherOrders = otherOrders.length > 0

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center px-4 text-center ${hasOtherOrders ? 'justify-start py-10' : 'justify-center'}`}>
      <div className="card max-w-sm w-full shadow-lg py-10 px-8">
        <div className="text-7xl mb-6">{config.emoji}</div>
        <h1 className={`text-2xl font-extrabold mb-2 ${config.color}`}>{config.label}</h1>

        {/* Order number box — shows all ready numbers when multiple are ready */}
        <div className="bg-gray-50 rounded-xl px-6 py-4 mt-6 mb-4">
          {allReadyNumbers.length > 1 ? (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Numbers ready for collection
              </p>
              <p className="text-4xl font-extrabold text-gray-900 tracking-wider">
                {[...allReadyNumbers]
                  .sort((a, b) => (a.daily_number ?? 9999) - (b.daily_number ?? 9999))
                  .map((o) => displayNum(o))
                  .join(', ')}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order number</p>
              <p className="text-4xl font-extrabold text-gray-900 tracking-wider">{displayNum(order)}</p>
            </>
          )}
        </div>

        <p className="text-gray-500 text-sm mt-2">Hi {order.buyer_name}!</p>

        {/* Sound alert enable button */}
        {!soundReady && order.status !== 'collected' && (
          <button
            onClick={enableSound}
            className="mt-5 w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            🔔 Tap to enable sound alerts
          </button>
        )}
        {soundReady && (
          <p className="mt-4 text-xs text-green-600 font-medium">🔔 Sound alerts on</p>
        )}

        {order.status === 'placed' && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-700 text-sm">
              Keep this page open — you&apos;ll need to show it when you collect your order,
              or bring a copy of your confirmation email/text if you received one.
            </p>
          </div>
        )}
        {order.status === 'ready' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-semibold">Please come to the counter to collect your order.</p>
            <p className="text-green-600 text-sm mt-2">
              Have this screen ready to show staff, or your confirmation email/text.
            </p>
          </div>
        )}
        {order.status !== 'collected' && (
          <p className="text-xs text-gray-400 mt-6">This page refreshes automatically.</p>
        )}
      </div>

      {/* Other orders from this device */}
      {hasOtherOrders && (
        <div className="max-w-sm w-full px-4 mt-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide text-center mb-3">Your other orders</p>
          <div className="space-y-2">
            {otherOrders.map((o) => {
              const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.placed
              return (
                <Link
                  key={o.order_number}
                  href={`/store/${slug}/order/${encodeURIComponent(o.order_number)}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:border-gray-300 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-base">{displayNum(o)}</span>
                  <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
