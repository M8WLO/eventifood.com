'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Report {
  date_from: string
  date_to: string
  total_orders: number
  total_revenue: string
  total_wastage_cost: string
  total_cost_price: string
  gross_profit: string
  revenue_by_category: { category: string; revenue: string }[]
  top_products: { product_name: string; total_qty: number; total_revenue: string }[]
}

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('today')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/orders/seller/report/?period=${period}`)
      .then((r) => setReport(r.data))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p.value ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : report ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total sales" value={report.total_orders.toString()} />
            <StatCard label="Revenue" value={`£${Number(report.total_revenue).toFixed(2)}`} highlight />
            <StatCard label="Wastage cost" value={`£${Number(report.total_wastage_cost).toFixed(2)}`} />
            <StatCard label="Gross profit" value={`£${Number(report.gross_profit).toFixed(2)}`} highlight />
          </div>

          {/* Top products */}
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Top products</h2>
          <div className="card p-0 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Qty sold</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {report.top_products.map((p) => (
                  <tr key={p.product_name}>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.product_name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.total_qty}</td>
                    <td className="px-4 py-3 text-gray-900">£{Number(p.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
                {report.top_products.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No sales yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Revenue by category */}
          {report.revenue_by_category.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Revenue by category</h2>
              <div className="space-y-2">
                {report.revenue_by_category.map((c) => (
                  <div key={c.category} className="flex items-center justify-between card py-2 px-4">
                    <span className="text-sm text-gray-700 font-medium">{c.category}</span>
                    <span className="text-sm font-bold text-brand-600">£{Number(c.revenue).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-gray-400">No data available.</p>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${highlight ? 'text-brand-500' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
