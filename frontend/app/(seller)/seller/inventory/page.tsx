'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

interface StockRow {
  id?: number
  product: number
  product_name: string
  date: string
  starting_qty: number | null
  dirty?: boolean
}

export default function InventoryPage() {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [rows, setRows] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [carryOverDate, setCarryOverDate] = useState<string | null>(null)
  const [carryOverLoading, setCarryOverLoading] = useState(false)
  const [savingAll, setSavingAll] = useState(false)

  const load = useCallback((date: string) => {
    setLoading(true)
    api.get(`/api/inventory/stock/today/?date=${date}`)
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(selectedDate) }, [selectedDate, load])

  useEffect(() => {
    api.get(`/api/inventory/stock/last-before/?date=${selectedDate}`)
      .then((r) => setCarryOverDate(r.data.date || null))
      .catch(() => setCarryOverDate(null))
  }, [selectedDate])

  const update = (idx: number, value: number | null) => {
    setRows((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], starting_qty: value, dirty: true }
      return next
    })
  }

  const save = async (row: StockRow, idx: number) => {
    try {
      if (row.id) {
        await api.patch(`/api/inventory/stock/${row.id}/`, { starting_qty: row.starting_qty })
      } else {
        const res = await api.post('/api/inventory/stock/', {
          product: row.product,
          date: selectedDate,
          starting_qty: row.starting_qty,
        })
        setRows((prev) => {
          const next = [...prev]
          next[idx] = { id: res.data.id, product: row.product, product_name: row.product_name, date: selectedDate, starting_qty: row.starting_qty, dirty: false }
          return next
        })
        return
      }
      setRows((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], dirty: false }
        return next
      })
    } catch {
      alert('Save failed')
    }
  }

  const saveAll = async () => {
    setSavingAll(true)
    await Promise.all(rows.map((row, idx) => row.dirty ? save(row, idx) : Promise.resolve()))
    setSavingAll(false)
  }

  const carryOver = async () => {
    if (!carryOverDate) return
    setCarryOverLoading(true)
    try {
      const { data } = await api.get(`/api/inventory/stock/last-before/?date=${selectedDate}`)
      if (!data.records?.length) return
      const qtyMap: Record<number, number> = {}
      data.records.forEach((r: { product: number; starting_qty: number }) => { qtyMap[r.product] = r.starting_qty })
      setRows((prev) => prev.map((row) =>
        row.product in qtyMap ? { ...row, starting_qty: qtyMap[row.product], dirty: true } : row
      ))
    } finally {
      setCarryOverLoading(false)
    }
  }

  const dirtyCount = rows.filter((r) => r.dirty).length

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-400 mt-0.5">Set opening stock for a trading day</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value) }}
          className="input-field text-sm w-40 shrink-0"
        />
      </div>

      {carryOverDate && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-sm text-blue-700 flex-1">
            Last recorded stock: <span className="font-semibold">{fmtDate(carryOverDate)}</span>
          </span>
          <button
            onClick={carryOver}
            disabled={carryOverLoading}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {carryOverLoading ? 'Filling…' : 'Fill from that day'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 py-12 text-center">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>No products found. Add products to your menu first.</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Opening qty</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, idx) => (
                  <tr key={idx} className={row.dirty ? 'bg-brand-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.product_name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        value={row.starting_qty ?? ''}
                        onChange={(e) => update(idx, e.target.value ? Number(e.target.value) : null)}
                        className="input-field w-24"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => save(row, idx)}
                        disabled={!row.dirty}
                        className="btn-primary text-xs py-1 px-3 disabled:opacity-30"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dirtyCount > 0 && (
            <div className="flex justify-end">
              <button onClick={saveAll} disabled={savingAll} className="btn-primary">
                {savingAll ? 'Saving…' : `Save all (${dirtyCount})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
