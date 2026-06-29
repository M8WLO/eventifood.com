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
  size: string
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
      .catch(() => { setNotFound(true); setLoading(false) })
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
  const cols = menu.size === 'a2' ? 4 : menu.size === 'a3' ? 3 : 2

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header — matches PDF header style */}
      <div style={{ backgroundColor: '#111827' }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-6">
          {menu.banner ? (
            <img src={menu.banner} alt={menu.store_name} className="h-14 object-contain rounded-lg" style={{ maxWidth: 180 }} />
          ) : (
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{menu.store_name}</h1>
          )}
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">Menu</p>
            <p className="text-white font-bold">{menu.name}</p>
          </div>
          <Link
            href={`/store/${slug}`}
            className="ml-4 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: colors.primary }}
          >
            Order now →
          </Link>
        </div>
      </div>

      {/* Item grid */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '16px',
          }}
        >
          {menu.items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="border border-gray-200 rounded-xl flex flex-col bg-white shadow-sm"
            >
              {/* Photo + QR row — identical layout to the PDF */}
              <div className="flex rounded-t-xl overflow-hidden" style={{ height: 120 }}>
                {item.photo ? (
                  <img src={item.photo} alt={item.name} className="flex-1 object-cover" />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-100">
                    <span className="text-3xl">🍽️</span>
                  </div>
                )}
                {item.qr_code_svg ? (
                  <div
                    className="shrink-0 [&>svg]:w-full [&>svg]:h-full border-l border-gray-200 bg-white"
                    style={{ width: 120, height: 120 }}
                    dangerouslySetInnerHTML={{ __html: item.qr_code_svg }}
                  />
                ) : (
                  <div className="shrink-0 bg-gray-100 flex items-center justify-center text-xs text-gray-400" style={{ width: 120 }}>
                    No QR
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col p-3">
                <p className="font-bold text-gray-900 text-sm leading-tight">{item.name}</p>
                {item.description && (
                  <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                )}
                <div className="mt-auto pt-2">
                  {item.price ? (
                    <p className="text-lg font-extrabold text-gray-900">£{Number(item.price).toFixed(2)}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">See menu</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto px-6 pb-10 flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
        <p className="text-xs text-gray-400">Scan any item QR code to add it directly to your order</p>
        <Link
          href={`/store/${slug}`}
          className="text-sm font-semibold px-6 py-2.5 rounded-xl text-white transition-colors"
          style={{ backgroundColor: colors.primary }}
        >
          Order online →
        </Link>
      </div>
    </div>
  )
}
