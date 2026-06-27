'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Variation {
  id: number
  name: string
  retail_price: string
  is_available: boolean
}

interface Product {
  id: number
  name: string
  description: string
  photo: string | null
  is_visible: boolean
  out_of_stock: boolean
  variations: Variation[]
}

interface Category {
  id: number
  name: string
  products: Product[]
}

interface BasketItem {
  variationId: number
  productName: string
  variationName: string
  price: number
  quantity: number
}

export default function StorefrontPage() {
  const params = useParams()
  const slug = params.slug as string

  const [categories, setCategories] = useState<Category[]>([])
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(true)
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Set tenant slug header for this session
    api.defaults.headers.common['X-Tenant-Slug'] = slug

    Promise.all([
      api.get('/api/catalog/menu/'),
      api.get('/api/tenants/public/'),
    ]).then(([menuRes, tenantRes]) => {
      setCategories(menuRes.data)
      setStoreName(tenantRes.data.name)
      // Expand all categories by default
      setExpanded(new Set(menuRes.data.map((c: Category) => c.id)))
    }).finally(() => setLoading(false))
  }, [slug])

  const addToBasket = (product: Product, variation: Variation) => {
    setBasket((prev) => {
      const existing = prev.find((i) => i.variationId === variation.id)
      if (existing) {
        return prev.map((i) => i.variationId === variation.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        variationId: variation.id,
        productName: product.name,
        variationName: variation.name,
        price: Number(variation.retail_price),
        quantity: 1,
      }]
    })
  }

  const basketTotal = basket.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const basketCount = basket.reduce((sum, i) => sum + i.quantity, 0)

  // Persist basket to sessionStorage whenever it changes
  useEffect(() => {
    if (basket.length > 0) {
      sessionStorage.setItem('basket', JSON.stringify(basket))
    }
  }, [basket])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-gray-400">Loading menu…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-32">
      {/* Header */}
      <header className="bg-orange-500 text-white px-4 py-6 text-center shadow">
        <h1 className="text-2xl font-extrabold">{storeName}</h1>
        <p className="text-orange-100 text-sm mt-1">Scan to order · Collect when ready</p>
      </header>

      {/* Menu */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="card p-0 overflow-hidden">
            <button
              onClick={() => setExpanded((prev) => {
                const next = new Set(prev)
                next.has(cat.id) ? next.delete(cat.id) : next.add(cat.id)
                return next
              })}
              className="w-full text-left px-4 py-3 font-bold text-gray-900 flex justify-between items-center hover:bg-gray-50"
            >
              {cat.name}
              <span className="text-gray-400 text-sm">{expanded.has(cat.id) ? '▲' : '▼'}</span>
            </button>
            {expanded.has(cat.id) && (
              <div className="divide-y divide-gray-100">
                {cat.products.filter((p) => p.is_visible && !p.out_of_stock).map((product) => (
                  <div key={product.id} className="px-4 py-4">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    {product.description && <p className="text-sm text-gray-500 mt-0.5">{product.description}</p>}
                    <div className="mt-3 space-y-2">
                      {product.variations.filter((v) => v.is_available).map((v) => (
                        <div key={v.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{v.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">£{Number(v.retail_price).toFixed(2)}</span>
                            <button
                              onClick={() => addToBasket(product, v)}
                              className="bg-orange-500 text-white text-sm font-semibold px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Sticky basket bar */}
      {basketCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <Link
            href={`/store/${slug}/basket`}
            className="flex items-center justify-between bg-orange-500 text-white font-bold px-5 py-3 rounded-xl hover:bg-orange-600 transition-colors max-w-lg mx-auto"
          >
            <span className="bg-orange-600 text-white text-sm px-2 py-0.5 rounded-full">{basketCount}</span>
            <span>View basket</span>
            <span>£{basketTotal.toFixed(2)}</span>
          </Link>
        </div>
      )}
    </div>
  )
}
