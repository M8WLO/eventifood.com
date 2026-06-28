'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

interface WastageRow {
  id?: number
  product: number
  product_name: string
  date: string
  wastage_qty: number
  wastage_cost: string
  notes: string
  saving?: boolean
}

type WastageRowWithIdx = WastageRow & { _idx: number }

export default function WastagePage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [rows, setRows] = useState<WastageRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback((d: string) => {
    setLoading(true)
    api.get(`/api/inventory/stock/today/?date=${d}`)
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(date) }, [date, load])

  const saveRow = async (row: WastageRow, idx: number, patch: Partial<WastageRow>) => {
    const updated = { ...row, ...patch }
    setRows((prev) => {
      const next = [...prev]
      next[idx] = { ...updated, saving: true }
      return next
    })
    try {
      if (updated.id) {
        const res = await api.patch(`/api/inventory/stock/${updated.id}/`, {
          wastage_qty: updated.wastage_qty,
          wastage_cost: updated.wastage_cost,
          notes: updated.notes,
        })
        setRows((prev) => {
          const next = [...prev]
          next[idx] = { ...res.data, product_name: row.product_name, saving: false }
          return next
        })
      } else {
        const res = await api.post('/api/inventory/stock/', {
          product: updated.product,
          date: updated.date,
          wastage_qty: updated.wastage_qty,
          wastage_cost: updated.wastage_cost,
          notes: updated.notes,
        })
        setRows((prev) => {
          const next = [...prev]
          next[idx] = { ...res.data, product_name: row.product_name, saving: false }
          return next
        })
      }
    } catch {
      setRows((prev) => {
        const next = [...prev]
        next[idx] = { ...updated, saving: false }
        return next
      })
    }
  }

  const adjust = (idx: number, delta: number) => {
    const row = rows[idx]
    const newQty = Math.max(0, row.wastage_qty + delta)
    if (newQty === row.wastage_qty) return
    saveRow(row, idx, { wastage_qty: newQty })
  }

  const updateNotes = (idx: number, notes: string) => {
    setRows((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], notes }
      return next
    })
  }

  const filtered: WastageRowWithIdx[] = rows
    .map((r, i) => ({ ...r, _idx: i }))
    .filter((r) =>
      !search || r.product_name.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Wastage Log</h1>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="input-field w-40"
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
        <input
          type="text"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          className="input-field pl-9 w-full"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-gray-400 py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🗑️</p>
          <p>{search ? 'No items match your search.' : 'No products found. Add products to your menu first.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <div key={row.product} className="card p-4">
              <div className="flex items-center gap-3">
                <span className="flex-1 font-medium text-gray-900 truncate">{row.product_name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => adjust(row._idx, -1)}
                    disabled={row.wastage_qty === 0 || row.saving}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-700 font-bold text-xl flex items-center justify-center transition-colors select-none"
                    aria-label={`Decrease wastage for ${row.product_name}`}
                  >
                    −
                  </button>
                  <span className={`w-12 text-center text-2xl font-bold tabular-nums ${row.wastage_qty > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                    {row.saving ? '…' : row.wastage_qty}
                  </span>
                  <button
                    onClick={() => adjust(row._idx, 1)}
                    disabled={row.saving}
                    className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-30 text-red-600 font-bold text-xl flex items-center justify-center transition-colors select-none"
                    aria-label={`Increase wastage for ${row.product_name}`}
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={row.notes}
                placeholder="Notes (optional)…"
                onChange={(e) => updateNotes(row._idx, e.target.value)}
                onBlur={(e) => saveRow(rows[row._idx], row._idx, { notes: e.target.value })}
                className="mt-3 input-field text-sm w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
