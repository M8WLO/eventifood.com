'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface StockRow {
  id?: number
  product: number
  product_name: string
  date: string
  starting_qty: number | null
  wastage_qty: number
  wastage_cost: string
  notes: string
  dirty?: boolean
}

export default function InventoryPage() {
  const [rows, setRows] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    api.get('/api/inventory/stock/today/')
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false))
  }, [today])

  const update = (idx: number, field: string, value: string | number | null) => {
    setRows((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value, dirty: true }
      return next
    })
  }

  const save = async (row: StockRow, idx: number) => {
    try {
      if (row.id) {
        await api.patch(`/api/inventory/stock/${row.id}/`, {
          starting_qty: row.starting_qty,
          wastage_qty: row.wastage_qty,
          wastage_cost: row.wastage_cost,
          notes: row.notes,
        })
      } else {
        const res = await api.post('/api/inventory/stock/', {
          product: row.product,
          date: today,
          starting_qty: row.starting_qty,
          wastage_qty: row.wastage_qty,
          wastage_cost: row.wastage_cost,
          notes: row.notes,
        })
        setRows((prev) => {
          const next = [...prev]
          next[idx] = { ...res.data, product_name: row.product_name, dirty: false }
          return next
        })
        return
      }
      setRows((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], dirty: false }
        return next
      })
    } catch (e) {
      alert('Save failed')
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading inventory…</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory</h1>
      <p className="text-sm text-gray-400 mb-6">Today: {today}</p>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>No products found. Add products to your menu first.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Starting qty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Wastage qty</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Wastage cost</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, idx) => (
                <tr key={idx} className={row.dirty ? 'bg-brand-50' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.product_name}</td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} value={row.starting_qty ?? ''} onChange={(e) => update(idx, 'starting_qty', e.target.value ? Number(e.target.value) : null)} className="input-field w-20" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} value={row.wastage_qty} onChange={(e) => update(idx, 'wastage_qty', Number(e.target.value))} className="input-field w-20" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} step="0.01" value={row.wastage_cost} onChange={(e) => update(idx, 'wastage_cost', e.target.value)} className="input-field w-24" />
                  </td>
                  <td className="px-4 py-2">
                    <input value={row.notes} onChange={(e) => update(idx, 'notes', e.target.value)} className="input-field" placeholder="Notes…" />
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => save(row, idx)} disabled={!row.dirty} className="btn-primary text-xs py-1 px-3 disabled:opacity-30">
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
