'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Variation {
  id: number
  name: string
  retail_price: string
  cost_price: string | null
  is_available: boolean
}

interface Product {
  id: number
  name: string
  description: string
  is_visible: boolean
  out_of_stock: boolean
  variations: Variation[]
}

interface Category {
  id: number
  name: string
  display_order: number
  products: Product[]
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  const load = () => {
    api.get('/api/catalog/categories/')
      .then((r) => setCategories(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    setAddingCat(true)
    try {
      await api.post('/api/catalog/categories/', { name: newCatName, display_order: categories.length })
      setNewCatName('')
      load()
    } finally {
      setAddingCat(false)
    }
  }

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete this category and all its products?')) return
    await api.delete(`/api/catalog/categories/${id}/`)
    load()
  }

  if (loading) return <div className="p-8 text-gray-400">Loading menu…</div>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
      </div>

      {/* Add category */}
      <div className="card mb-6 flex gap-3">
        <input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="New category name…"
          className="input-field"
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
        />
        <button onClick={addCategory} disabled={addingCat} className="btn-primary shrink-0">
          Add category
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="card p-0 overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(cat.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                <span className="text-xs text-gray-400">({cat.products.length} products)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id) }}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                >
                  Delete
                </button>
                <span className="text-gray-400 text-sm">{expanded.has(cat.id) ? '▲' : '▼'}</span>
              </div>
            </div>
            {expanded.has(cat.id) && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {cat.products.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">No products yet.</p>
                )}
                {cat.products.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                      <div className="flex gap-2 mt-1">
                        {p.variations.map((v) => (
                          <span key={v.id} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                            {v.name} £{v.retail_price}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {p.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                      {p.out_of_stock && (
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Out of stock</span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2">
                  <button className="text-xs text-orange-600 hover:underline font-medium">
                    + Add product
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p>No categories yet. Add one above to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
