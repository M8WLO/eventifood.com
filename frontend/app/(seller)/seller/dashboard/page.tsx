'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Stats {
  total_orders: number
  total_revenue: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/orders/seller/report/?period=today')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Today's stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Orders today</p>
          <p className="text-3xl font-extrabold text-gray-900">
            {loading ? '—' : stats?.total_orders ?? 0}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Revenue today</p>
          <p className="text-3xl font-extrabold text-orange-500">
            {loading ? '—' : `£${Number(stats?.total_revenue ?? 0).toFixed(2)}`}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Active orders</p>
          <Link href="/seller/orders" className="text-3xl font-extrabold text-blue-500 hover:underline">
            View →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">Quick actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/seller/orders"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer"
        >
          <span className="text-3xl">🧾</span>
          <div>
            <p className="font-semibold text-gray-900">Order board</p>
            <p className="text-sm text-gray-500">Manage incoming orders live</p>
          </div>
        </Link>
        <Link
          href="/seller/settings"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer"
        >
          <span className="text-3xl">📱</span>
          <div>
            <p className="font-semibold text-gray-900">Download QR code</p>
            <p className="text-sm text-gray-500">Print &amp; display for customers</p>
          </div>
        </Link>
        <Link
          href="/seller/menu"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer"
        >
          <span className="text-3xl">🍽️</span>
          <div>
            <p className="font-semibold text-gray-900">Edit menu</p>
            <p className="text-sm text-gray-500">Add categories and products</p>
          </div>
        </Link>
        <Link
          href="/seller/analytics"
          className="card hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer"
        >
          <span className="text-3xl">📊</span>
          <div>
            <p className="font-semibold text-gray-900">Sales report</p>
            <p className="text-sm text-gray-500">Revenue, top products, wastage</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
