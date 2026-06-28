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
  { value: 'custom', label: 'Custom' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('today')
  const [dateFrom, setDateFrom] = useState(todayStr())
  const [dateTo, setDateTo] = useState(todayStr())
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  // Event mode: multiply figures by this fraction (e.g. 30% → 0.3)
  const [eventPct, setEventPct] = useState<number>(100)
  const [eventInput, setEventInput] = useState('100')
  const [eventMode, setEventMode] = useState(false)

  const multiplier = eventMode ? eventPct / 100 : 1

  useEffect(() => {
    setLoading(true)
    let url = `/api/orders/seller/report/?period=${period}`
    if (period === 'custom') {
      url = `/api/orders/seller/report/?date_from=${dateFrom}&date_to=${dateTo}`
    }
    api.get(url)
      .then((r) => setReport(r.data))
      .finally(() => setLoading(false))
  }, [period, dateFrom, dateTo])

  const applyEvent = () => {
    const n = parseFloat(eventInput)
    if (!isNaN(n) && n >= 0 && n <= 100) {
      setEventPct(n)
      setEventMode(true)
    }
  }

  const fmt = (val: string | number) =>
    `£${(Number(val) * multiplier).toFixed(2)}`

  const fmtInt = (val: number) =>
    Math.round(val * multiplier).toString()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

        {/* Event mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
            <input
              type="number"
              min={0}
              max={100}
              value={eventInput}
              onChange={(e) => setEventInput(e.target.value)}
              className="w-14 text-sm text-center border-none outline-none bg-transparent"
              placeholder="100"
            />
            <span className="text-gray-400 text-xs">%</span>
          </div>
          <button
            onClick={() => {
              if (eventMode && eventPct === 100) {
                setEventMode(false)
              } else {
                applyEvent()
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${eventMode ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            title="Show a percentage of total figures (e.g. your share at a split event)"
          >
            Event
          </button>
          {eventMode && (
            <button
              onClick={() => { setEventMode(false); setEventInput('100') }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {eventMode && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
          Showing <span className="font-semibold">{eventPct}%</span> of all figures — event share mode active.
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
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

      {/* Date range picker (custom mode) */}
      {period === 'custom' && (
        <div className="flex items-center gap-3 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field text-sm py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={todayStr()}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field text-sm py-1.5"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : report ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total sales" value={fmtInt(report.total_orders)} />
            <StatCard label="Revenue" value={fmt(report.total_revenue)} highlight />
            <StatCard label="Wastage cost" value={fmt(report.total_wastage_cost)} />
            <StatCard label="Gross profit" value={fmt(report.gross_profit)} highlight />
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
                    <td className="px-4 py-3 text-gray-600">{fmtInt(p.total_qty)}</td>
                    <td className="px-4 py-3 text-gray-900">{fmt(p.total_revenue)}</td>
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
                    <span className="text-sm font-bold text-brand-600">{fmt(c.revenue)}</span>
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
