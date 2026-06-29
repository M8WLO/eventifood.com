'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

const THEME_COLORS: Record<string, { primary: string; dark: string }> = {
  default: { primary: '#7B21B6', dark: '#581584' },
  sunset:  { primary: '#e11d48', dark: '#be123c' },
  ocean:   { primary: '#0891b2', dark: '#0e7490' },
  forest:  { primary: '#16a34a', dark: '#15803d' },
  amber:   { primary: '#d97706', dark: '#b45309' },
  coral:   { primary: '#ea580c', dark: '#c2410c' },
  ruby:    { primary: '#dc2626', dark: '#b91c1c' },
  teal:    { primary: '#0d9488', dark: '#0f766e' },
  indigo:  { primary: '#4f46e5', dark: '#4338ca' },
  navy:    { primary: '#1d4ed8', dark: '#1e40af' },
  pink:    { primary: '#db2777', dark: '#be185d' },
  slate:   { primary: '#475569', dark: '#334155' },
}

interface MenuItem {
  type: string
  id: number
  name: string
  description: string
  price: string | null
  photo: string | null
  qr_code_svg: string
}

interface MenuData {
  id: number
  name: string
  items: MenuItem[]
  banner: string | null
  store_name: string
  theme: string
  slug: string
}

export default function PublicMenuPage() {
  const params = useParams()
  const slug = params.slug as string
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.defaults.headers.common['X-Tenant-Slug'] = slug
    api.get('/api/catalog/public-menu/')
      .then((r) => { setMenu(r.data); setLoading(false) })
      .catch((e) => {
        setNotFound(true)
        setLoading(false)
      })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Loading menu…</p>
    </div>
  )

  if (notFound || !menu) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-6 text-center">
      <p className="text-4xl">🍽️</p>
      <p className="font-semibold text-gray-700">No public menu available</p>
      <p className="text-sm text-gray-400">This store hasn&apos;t published a menu page yet.</p>
      <Link href={`/store/${slug}`} className="text-sm text-brand-600 underline">Go to the ordering page</Link>
    </div>
  )

  const colors = THEME_COLORS[menu.theme] || THEME_COLORS.default

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: colors.dark }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {menu.banner ? (
            <img src={menu.banner} alt={menu.store_name} className="h-10 object-contain rounded" style={{ maxWidth: 120 }} />
          ) : (
            <span className="font-bold text-white text-lg">{menu.store_name}</span>
          )}
          <div className="flex-1" />
          <Link
            href={`/store/${slug}`}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            Order now
          </Link>
        </div>
        <div className="border-t border-white/10 px-4 py-2 max-w-2xl mx-auto">
          <p className="text-white/70 text-xs">{menu.name}</p>
        </div>
      </div>

      {/* Items */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {menu.items.map((item) => (
          <div key={`${item.type}-${item.id}`} className="bg-white rounded-xl shadow-sm overflow-hidden flex">
            {item.photo && (
              <img
                src={item.photo}
                alt={item.name}
                className="w-28 object-cover shrink-0"
              />
            )}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
              <div>
                <p className="font-semibold text-gray-900 leading-tight">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 leading-snug line-clamp-2">{item.description}</p>
                )}
              </div>
              <div className="flex items-end justify-between gap-2 mt-3">
                <p className="font-bold text-gray-900">
                  {item.price ? `£${Number(item.price).toFixed(2)}` : <span className="text-gray-400 font-normal text-sm italic">See menu</span>}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="max-w-2xl mx-auto px-4 pb-10 text-center">
        <Link
          href={`/store/${slug}`}
          className="inline-block text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
          style={{ backgroundColor: colors.primary }}
        >
          Order online →
        </Link>
        <p className="text-xs text-gray-400 mt-3">Scan a QR code at the counter to add items directly to your order</p>
      </div>
    </div>
  )
}
