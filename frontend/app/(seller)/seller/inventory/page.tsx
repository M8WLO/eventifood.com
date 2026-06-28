'use client'

import { useEffect, useState } from 'react'
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
  const [rows, setRows] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    api.get('/api/inventory/stock/today/')
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false))
  }, [today])

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
          date: today,
          starting_qty: row.starting_qty,
        })
        setRows((prev) => {
          const next = [...prev]
          next[idx] = { id: res.data.id, product: row.product, product_name: row.product_name, date: today, starting_qty: row.starting_qty, dirty: false }
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

  if (loading) return <div className="p-8 text-gray-400">Loading inventory…</div>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Inventory</h1>
      <p className="text-sm text-gray-400 mb-6">Set opening stock for today · {today}</p>

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
      )}
    </div>
  )
}
