'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Variation {
  id: number
  name: string
  retail_price: string
}

interface Product {
  id: number
  name: string
  description: string
  base_price: string
  has_variations: boolean
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

export default function MenuDisplayPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(true)
  const [needsFullscreen, setNeedsFullscreen] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/catalog/categories/'),
      api.get('/api/tenants/mine/'),
    ]).then(([catRes, tenantRes]) => {
      setCategories(catRes.data)
      setStoreName(tenantRes.data.name || '')
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setNeedsFullscreen(true)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {})
    setNeedsFullscreen(false)
  }

  const fmt = (v: string) => `£${parseFloat(v).toFixed(2)}`

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-xl">Loading menu…</p>
      </div>
    )
  }

  const visibleCats = categories
    .filter((c) => c.products.some((p) => p.is_visible))
    .sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-10 py-5">
        <h1 className="text-3xl font-extrabold text-white tracking-wide">{storeName}</h1>
      </div>

      {/* Menu content */}
      <div className="px-10 py-8 space-y-10 pb-20">
        {visibleCats.map((cat) => {
          const products = cat.products.filter((p) => p.is_visible)
          if (!products.length) return null
          return (
            <div key={cat.id}>
              <h2 className="text-2xl font-bold text-brand-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
                {cat.name}
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className={`flex items-start justify-between gap-4 py-3 ${prod.out_of_stock ? 'opacity-40' : ''}`}
                  >
                    <div className="flex-1">
                      <p className="text-xl font-semibold text-white leading-snug">
                        {prod.name}
                        {prod.out_of_stock && (
                          <span className="ml-2 text-sm font-normal text-gray-500 uppercase tracking-wide">Sold out</span>
                        )}
                      </p>
                      {prod.description && (
                        <p className="text-gray-400 text-base mt-0.5 leading-snug">{prod.description}</p>
                      )}
                      {prod.has_variations && prod.variations.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                          {prod.variations.map((v) => (
                            <span key={v.id} className="text-base text-gray-300">
                              {v.name} — <span className="text-white font-medium">{fmt(v.retail_price)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!prod.has_variations && (
                      <p className="text-2xl font-bold text-white shrink-0">{fmt(prod.base_price)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {needsFullscreen && (
        <div
          onClick={enterFullscreen}
          className="fixed inset-0 bg-black/60 z-20 flex items-end justify-center pb-16 cursor-pointer"
        >
          <div className="bg-white/95 backdrop-blur rounded-2xl px-8 py-5 text-center shadow-xl">
            <p className="text-lg font-semibold text-gray-900">Click anywhere to go fullscreen</p>
            <p className="text-sm text-gray-500 mt-0.5">Press Esc to exit fullscreen</p>
          </div>
        </div>
      )}
    </div>
  )
}
