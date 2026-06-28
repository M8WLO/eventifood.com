'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import api from '@/lib/api'

const QrScannerModal = dynamic(() => import('./QrScannerModal'), { ssr: false })

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
  prep_time_minutes: number | null
  variations: Variation[]
  extras: Extra[]
}

interface Category {
  id: number
  name: string
  products: Product[]
}

interface ActiveEvent {
  id: number
  name: string
  item_overrides: { type: 'product' | 'variation'; id: number; price_override: number | null }[]
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
  const [waitTimeEnabled, setWaitTimeEnabled] = useState(false)
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null)
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [trialExpired, setTrialExpired] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
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
      setWaitTimeEnabled(!!tenantRes.data.wait_time_enabled)
      setEstimatedWait(tenantRes.data.estimated_wait_minutes ?? null)
      setActiveEvent(tenantRes.data.active_event || null)
      setTrialExpired(!!tenantRes.data.trial_expired)
      const demo = !!tenantRes.data.is_demo
      setIsDemo(demo)
      sessionStorage.setItem(`ef_demo_${slug}`, demo ? '1' : '0')
      const t = tenantRes.data.theme || 'default'
      setTheme(t)
      sessionStorage.setItem(`ef_theme_${slug}`, t)
      sessionStorage.setItem(`ef_name_${slug}`, tenantRes.data.name || '')
      sessionStorage.setItem(`ef_payment_mode_${slug}`, tenantRes.data.payment_mode || 'payg')
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

  const onQrScan = (productId: number, varId: number | null): string | null => {
    for (const cat of displayCategories) {
      const product = cat.products.find((p) => p.id === productId && p.is_visible && !p.out_of_stock)
      if (!product) continue
      const availVars = product.variations.filter((v) => v.is_available)
      if (varId) {
        const variation = availVars.find((v) => v.id === varId)
        if (variation) {
          commitToBasket(product, variation, [])
          return `${product.name}${variation.name !== 'Standard' ? ' — ' + variation.name : ''}`
        }
      } else if (availVars.length > 0) {
        commitToBasket(product, availVars[0], [])
        return product.name
      }
    }
    return null
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

  // Apply event menu filtering + price overrides when an event is active
  const displayCategories: Category[] = activeEvent
    ? (() => {
        const productOv = new Map(
          activeEvent.item_overrides.filter(o => o.type === 'product').map(o => [o.id, o.price_override])
        )
        const variationOv = new Map(
          activeEvent.item_overrides.filter(o => o.type === 'variation').map(o => [o.id, o.price_override])
        )
        const result: Category[] = []
        for (const cat of categories) {
          const products: Product[] = []
          for (const product of cat.products) {
            if (!product.is_visible || product.out_of_stock) continue
            if (productOv.has(product.id)) {
              const override = productOv.get(product.id)
              const newVariations = override != null
                ? product.variations.map(v => ({ ...v, retail_price: String(override) }))
                : product.variations
              products.push({ ...product, variations: newVariations })
            } else {
              const filteredVars = product.variations
                .filter(v => variationOv.has(v.id) && v.is_available)
                .map(v => {
                  const ov = variationOv.get(v.id)
                  return ov != null ? { ...v, retail_price: String(ov) } : v
                })
              if (filteredVars.length > 0) {
                products.push({ ...product, variations: filteredVars })
              }
            }
          }
          if (products.length > 0) result.push({ ...cat, products })
        }
        return result
      })()
    : categories

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading menu…</div>
      </div>
    )
  }

  if (trialExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{storeName || 'This store'} is temporarily unavailable</h1>
          <p className="text-gray-500 text-sm">Online ordering is not available right now. Please speak to staff to place your order.</p>
        </div>
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
          <button
            onClick={() => setScannerOpen(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-black/70 transition-colors"
          >
            <QrIcon />
            Scan item
          </button>
        </header>
      ) : (
        <header style={{ backgroundColor: colors.primary }} className="relative text-white px-4 py-6 text-center shadow">
          <h1 className="text-2xl font-extrabold">{storeName}</h1>
          <p className="text-sm opacity-80 mt-1">Collect your order when alerted</p>
          <button
            onClick={() => setScannerOpen(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
          >
            <QrIcon />
            Scan item
          </button>
        </header>
      )}

      {/* Live wait time banner */}
      {waitTimeEnabled && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            <span className="text-lg">⏱️</span>
            <div>
              <span className="font-semibold">Current estimated wait: </span>
              {estimatedWait
                ? `~${estimatedWait} min${estimatedWait !== 1 ? 's' : ''}`
                : 'Calculating…'}
            </div>
          </div>
        </div>
      )}

      {/* Active event banner */}
      {activeEvent && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: colors.dark }}
          >
            <span className="text-lg">🎪</span>
            <div>
              <span className="font-semibold">Event menu: </span>
              {activeEvent.name}
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {displayCategories.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p>Menu coming soon!</p>
          </div>
        )}
        {displayCategories.map((cat) => (
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
                              {product.prep_time_minutes && (
                                <p className="text-xs text-gray-400 mt-0.5">⏱ ~{product.prep_time_minutes} min prep</p>
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

      {/* Demo mode banner */}
      {isDemo && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-orange-500 text-white text-center text-xs font-semibold py-2 px-4">
          Demo store — this is a test environment, no payments will be taken
        </div>
      )}

      {/* Sticky basket bar */}
      {basketCount > 0 && (
        <div className={`fixed left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg ${isDemo ? 'bottom-8' : 'bottom-0'}`}>
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

      {/* QR scanner modal */}
      {scannerOpen && (
        <QrScannerModal
          onScan={onQrScan}
          onClose={() => setScannerOpen(false)}
        />
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

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
    </svg>
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
