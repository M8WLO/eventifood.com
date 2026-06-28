'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

interface MenuItem {
  type: string; id: number; name: string; description: string
  price: string | null; photo: string | null; qr_code_svg: string
}
interface MenuData {
  id: number; name: string; size: string
  items: MenuItem[]; banner: string | null; store_name: string
}

const SIZE_CSS: Record<string, string> = {
  a4: '210mm',
  a3: '297mm',
  a2: '420mm',
}

export default function PrintMenuPage() {
  const params = useParams()
  const id = params.id as string
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get(`/api/catalog/print-menus/${id}/render/`)
      .then((r) => { setMenu(r.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading menu…</p>
    </div>
  )
  if (error || !menu) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Menu not found.</p>
    </div>
  )

  const cols = menu.size === 'a2' ? 4 : menu.size === 'a3' ? 3 : 2
  const pageWidth = SIZE_CSS[menu.size] || '210mm'

  return (
    <>
      <style>{`
        @media print {
          @page { size: ${menu.size.toUpperCase()}; margin: 12mm; }
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
        }
        body { background: #f3f4f6; font-family: system-ui, sans-serif; }
        .item-card { break-inside: avoid; page-break-inside: avoid; }
      `}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:bg-gray-700 transition-colors"
        >
          🖨️ Print
        </button>
        <button
          onClick={() => window.close()}
          className="bg-white text-gray-600 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Page */}
      <div
        className="print-page mx-auto my-8 bg-white shadow-2xl rounded-xl overflow-hidden"
        style={{ width: pageWidth, maxWidth: '100%' }}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-8 py-6">
          <div className="flex items-center gap-6">
            {menu.banner ? (
              <img src={menu.banner} alt={menu.store_name} className="h-16 object-contain rounded-lg" style={{ maxWidth: 200 }} />
            ) : (
              <h1 className="text-3xl font-extrabold tracking-tight">{menu.store_name}</h1>
            )}
            <div className="flex-1" />
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-0.5">Menu</p>
              <p className="text-white font-bold text-lg">{menu.name}</p>
              <p className="text-white/50 text-xs mt-1">Scan any QR code to order on your phone</p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div
          className="p-6"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '16px',
          }}
        >
          {menu.items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="item-card border border-gray-200 rounded-xl overflow-hidden flex flex-col"
              style={{ background: '#fafafa' }}
            >
              {/* Photo */}
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="w-full object-cover" style={{ height: 120 }} />
              ) : (
                <div className="w-full flex items-center justify-center bg-gray-100" style={{ height: 72 }}>
                  <span className="text-3xl">🍽️</span>
                </div>
              )}

              {/* Details */}
              <div className="flex-1 flex flex-col p-3 gap-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm leading-tight">{item.name}</p>
                  {item.description && (
                    <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="flex items-end justify-between gap-2 mt-auto pt-2 border-t border-gray-200">
                  {/* Price */}
                  <div>
                    {item.price ? (
                      <p className="text-xl font-extrabold text-gray-900">£{Number(item.price).toFixed(2)}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">See menu</p>
                    )}
                  </div>

                  {/* QR code */}
                  {item.qr_code_svg ? (
                    <div
                      className="shrink-0 [&>svg]:w-full [&>svg]:h-full"
                      style={{ width: 72, height: 72 }}
                      dangerouslySetInnerHTML={{ __html: item.qr_code_svg }}
                    />
                  ) : (
                    <div className="shrink-0 bg-gray-200 rounded flex items-center justify-center" style={{ width: 72, height: 72 }}>
                      <span className="text-xs text-gray-400">No QR</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-400">Scan any item to add it directly to your order on your phone</p>
          <p className="text-xs text-gray-300">{menu.store_name}</p>
        </div>
      </div>
    </>
  )
}
