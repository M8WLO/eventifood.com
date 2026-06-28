'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Extra {
  id: number
  name: string
  additional_price: string
  is_available: boolean
}

interface Variation {
  id: number
  name: string
  retail_price: string
  photo: string | null
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
  extras: Extra[]
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
  extras: { id: number; name: string; additional_price: number }[]
}

const THEME_COLORS: Record<string, { primary: string; dark: string; badge: string }> = {
  default: { primary: '#7B21B6', dark: '#581584', badge: '#46106a' },
  sunset:  { primary: '#e11d48', dark: '#be123c', badge: '#9f1239' },
  ocean:   { primary: '#0891b2', dark: '#0e7490', badge: '#155e75' },
  forest:  { primary: '#16a34a', dark: '#15803d', badge: '#14532d' },
  amber:   { primary: '#d97706', dark: '#b45309', badge: '#92400e' },
  coral:   { primary: '#ea580c', dark: '#c2410c', badge: '#9a3412' },
  ruby:    { primary: '#dc2626', dark: '#b91c1c', badge: '#991b1b' },
  teal:    { primary: '#0d9488', dark: '#0f766e', badge: '#115e59' },
  indigo:  { primary: '#4f46e5', dark: '#4338ca', badge: '#3730a3' },
  navy:    { primary: '#1d4ed8', dark: '#1e40af', badge: '#1e3a8a' },
  pink:    { primary: '#db2777', dark: '#be185d', badge: '#9d174d' },
  slate:   { primary: '#475569', dark: '#334155', badge: '#1e293b' },
}

function StorefrontContent() {
  const params = useParams()
  const slug = params.slug as string
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [storeName, setStoreName] = useState('')
  const [banner, setBanner] = useState<string | null>(null)
  const [theme, setTheme] = useState('default')
  const [loading, setLoading] = useState(true)
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [extrasModal, setExtrasModal] = useState<{ product: Product; variation: Variation } | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<Set<number>>(new Set())
  const [addedToast, setAddedToast] = useState<string | null>(null)
  const qrAutoAdded = useRef(false)

  useEffect(() => {
    api.defaults.headers.common['X-Tenant-Slug'] = slug

    Promise.all([
      api.get('/api/catalog/menu/'),
      api.get('/api/tenants/public/'),
    ]).then(([menuRes, tenantRes]) => {
      setCategories(menuRes.data)
      setStoreName(tenantRes.data.name)
      setBanner(tenantRes.data.banner || null)
      const t = tenantRes.data.theme || 'default'
      setTheme(t)
      sessionStorage.setItem(`ef_theme_${slug}`, t)
      sessionStorage.setItem(`ef_name_${slug}`, tenantRes.data.name || '')
      setExpanded(new Set())
    }).finally(() => setLoading(false))
  }, [slug])

  const colors = THEME_COLORS[theme] || THEME_COLORS.default

  const openExtrasOrAdd = (product: Product, variation: Variation) => {
    const available = product.extras.filter((e) => e.is_available)
    if (available.length > 0) {
      setSelectedExtras(new Set())
      setExtrasModal({ product, variation })
    } else {
      commitToBasket(product, variation, [])
    }
  }

  const commitToBasket = (
    product: Product,
    variation: Variation,
    extras: { id: number; name: string; additional_price: number }[],
  ) => {
    const extrasTotal = extras.reduce((s, e) => s + e.additional_price, 0)
    setBasket((prev) => {
      // Key by variationId + sorted extra ids so same combos stack
      const key = `${variation.id}:${extras.map(e => e.id).sort().join(',')}`
      const existing = prev.find((i) => `${i.variationId}:${i.extras.map(e => e.id).sort().join(',')}` === key)
      if (existing) {
        return prev.map((i) => (`${i.variationId}:${i.extras.map(e => e.id).sort().join(',')}` === key) ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        variationId: variation.id,
        productName: product.name,
        variationName: variation.name,
        price: Number(variation.retail_price) + extrasTotal,
        quantity: 1,
        extras,
      }]
    })
  }

  const confirmExtras = () => {
    if (!extrasModal) return
    const { product, variation } = extrasModal
    const extras = product.extras
      .filter((e) => selectedExtras.has(e.id))
      .map((e) => ({ id: e.id, name: e.name, additional_price: Number(e.additional_price) }))
    commitToBasket(product, variation, extras)
    setExtrasModal(null)
  }

  const basketTotal = basket.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const basketCount = basket.reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => {
    if (basket.length > 0) {
      sessionStorage.setItem('basket', JSON.stringify(basket))
    }
  }, [basket])

  // Auto-add item from QR code URL params (?add=<product_id>&v=<variation_id>)
  useEffect(() => {
    if (categories.length === 0 || qrAutoAdded.current) return
    const addId = searchParams.get('add')
    const varId = searchParams.get('v')
    if (!addId) return
    qrAutoAdded.current = true

    const productId = parseInt(addId, 10)
    for (const cat of categories) {
      const product = cat.products.find((p) => p.id === productId && p.is_visible && !p.out_of_stock)
      if (!product) continue

      if (varId) {
        const variation = product.variations.find((v) => v.id === parseInt(varId, 10) && v.is_available)
        if (variation) {
          const available = product.extras.filter((e) => e.is_available)
          if (available.length > 0) {
            setSelectedExtras(new Set())
            setExtrasModal({ product, variation })
          } else {
            commitToBasket(product, variation, [])
            setAddedToast(`${product.name}${variation.name !== 'Standard' ? ' — ' + variation.name : ''} added!`)
            setTimeout(() => setAddedToast(null), 3000)
          }
        }
      } else {
        const available = product.variations.filter((v) => v.is_available)
        if (available.length === 1) {
          const variation = available[0]
          const hasExtras = product.extras.filter((e) => e.is_available).length > 0
          if (hasExtras) {
            setSelectedExtras(new Set())
            setExtrasModal({ product, variation })
          } else {
            commitToBasket(product, variation, [])
            setAddedToast(`${product.name} added!`)
            setTimeout(() => setAddedToast(null), 3000)
          }
        } else if (available.length > 1) {
          // Multi-variation product: expand the category so customer can choose
          setExpanded((prev) => { const n = new Set(prev); n.add(cat.id); return n })
        }
      }
      break
    }
  }, [categories, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading menu…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* QR auto-add toast */}
      {addedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-xl animate-fade-in">
          ✓ {addedToast}
        </div>
      )}

      {/* Header */}
      {banner ? (
        <header className="relative w-full shadow" style={{ height: 180 }}>
          <img src={banner} alt={storeName} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 px-4 py-2 text-center"
               style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }}>
            <p className="text-white text-xs opacity-90">Collect your order when alerted</p>
          </div>
        </header>
      ) : (
        <header style={{ backgroundColor: colors.primary }} className="text-white px-4 py-6 text-center shadow">
          <h1 className="text-2xl font-extrabold">{storeName}</h1>
          <p className="text-sm opacity-80 mt-1">Collect your order when alerted</p>
        </header>
      )}

      {/* Menu */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {categories.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p>Menu coming soon!</p>
          </div>
        )}
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
                {cat.products.filter((p) => p.is_visible && !p.out_of_stock).map((product) => {
                  const availableVars = product.variations.filter((v) => v.is_available)
                  const isSinglePrice = availableVars.length === 1 && availableVars[0].name === 'Standard'
                  return (
                    <div key={product.id} className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        {product.photo && (
                          <img
                            src={product.photo}
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{product.name}</h3>
                              {product.description && (
                                <p className="text-sm text-gray-500 mt-0.5">{product.description}</p>
                              )}
                            </div>
                            {isSinglePrice && (
                              <div className="flex items-center gap-3 shrink-0 mt-0.5">
                                <span className="text-sm font-bold text-gray-900">
                                  £{Number(availableVars[0].retail_price).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => openExtrasOrAdd(product, availableVars[0])}
                                  style={{ backgroundColor: colors.primary }}
                                  className="text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </div>
                          {!isSinglePrice && availableVars.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {availableVars.map((v) => (
                                <div key={v.id} className="flex items-center gap-3">
                                  {v.photo && (
                                    <img
                                      src={v.photo}
                                      alt={v.name}
                                      className="w-10 h-10 rounded-md object-cover shrink-0"
                                    />
                                  )}
                                  <span className="text-sm text-gray-700 flex-1">{v.name}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-900">
                                      £{Number(v.retail_price).toFixed(2)}
                                    </span>
                                    <button
                                      onClick={() => openExtrasOrAdd(product, v)}
                                      style={{ backgroundColor: colors.primary }}
                                      className="text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
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
            style={{ backgroundColor: colors.primary }}
            className="flex items-center justify-between text-white font-bold px-5 py-3 rounded-xl max-w-lg mx-auto hover:opacity-90 transition-opacity"
          >
            <span style={{ backgroundColor: colors.badge }} className="text-white text-sm px-2 py-0.5 rounded-full">
              {basketCount}
            </span>
            <span>View basket</span>
            <span>£{basketTotal.toFixed(2)}</span>
          </Link>
        </div>
      )}

      {/* Extras picker modal */}
      {extrasModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-5">
              <h3 className="font-bold text-gray-900 text-lg mb-1">Customise</h3>
              <p className="text-sm text-gray-500 mb-4">{extrasModal.product.name}</p>
              <div className="space-y-3 mb-5">
                {extrasModal.product.extras.filter((e) => e.is_available).map((extra) => {
                  const price = Number(extra.additional_price)
                  const priceLabel = price === 0 ? 'Free' : price > 0 ? `+£${price.toFixed(2)}` : `−£${Math.abs(price).toFixed(2)}`
                  return (
                    <label key={extra.id} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedExtras.has(extra.id)}
                          onChange={(e) => {
                            setSelectedExtras((prev) => {
                              const next = new Set(prev)
                              e.target.checked ? next.add(extra.id) : next.delete(extra.id)
                              return next
                            })
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-800">{extra.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${price < 0 ? 'text-green-600' : 'text-gray-700'}`}>{priceLabel}</span>
                    </label>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setExtrasModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExtras}
                  style={{ backgroundColor: colors.primary }}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                >
                  Add to basket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StorefrontPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading menu…</div>
      </div>
    }>
      <StorefrontContent />
    </Suspense>
  )
}
