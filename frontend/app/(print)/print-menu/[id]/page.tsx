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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Loading menu…</p>
    </div>
  )
  if (error || !menu) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Menu not found.</p>
    </div>
  )

  const cols = menu.size === 'a2' ? 4 : menu.size === 'a3' ? 3 : 2
  const pageSize = menu.size.toUpperCase()

  return (
    <>
      <style>{`
        @media print {
          @page { size: ${pageSize} portrait; margin: 12mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .menu-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .item-card { break-inside: avoid; page-break-inside: avoid; }
          .menu-grid { display: grid !important; }
        }
        html, body { font-family: system-ui, sans-serif; background: #f3f4f6; }
      `}</style>

      {/* Action bar — hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{menu.store_name} — {menu.name}</p>
          <p className="text-xs text-gray-400">
            {pageSize} · {menu.items.length} item{menu.items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <p className="text-xs text-gray-400 mr-2 hidden sm:block">
          In the dialog, choose <strong>Save as PDF</strong> as the destination
        </p>
        <button
          onClick={() => window.print()}
          className="bg-gray-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Download PDF
        </button>
        <button
          onClick={() => window.close()}
          className="text-sm text-gray-500 font-medium px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Page content — padded top to clear the fixed action bar on screen */}
      <div className="no-print" style={{ height: 64 }} />

      {/* Menu — prints from here */}
      <div className="bg-white mx-auto my-6 shadow-xl no-print-shadow" style={{ maxWidth: '900px' }}>

        {/* Header */}
        <div className="menu-header bg-gray-900 text-white px-8 py-6 flex items-center gap-6">
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

        {/* Item grid */}
        <div
          className="menu-grid p-6"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '16px',
          }}
        >
          {menu.items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="item-card border border-gray-200 rounded-xl flex flex-col"
              style={{ background: '#fafafa' }}
            >
              {/* Photo */}
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="w-full object-cover rounded-t-xl" style={{ height: 120 }} />
              ) : (
                <div className="w-full flex items-center justify-center bg-gray-100 rounded-t-xl" style={{ height: 72 }}>
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
                  <div>
                    {item.price ? (
                      <p className="text-xl font-extrabold text-gray-900">£{Number(item.price).toFixed(2)}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">See menu</p>
                    )}
                  </div>
                  {item.qr_code_svg ? (
                    <div
                      className="shrink-0 [&>svg]:w-full [&>svg]:h-full"
                      style={{ width: 72, height: 72 }}
                      dangerouslySetInnerHTML={{ __html: item.qr_code_svg }}
                    />
                  ) : (
                    <div className="shrink-0 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400" style={{ width: 72, height: 72 }}>
                      No QR
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

      <style>{`
        @media screen {
          .no-print-shadow { box-shadow: 0 10px 40px rgba(0,0,0,0.12); border-radius: 12px; overflow: hidden; margin-bottom: 48px; }
        }
      `}</style>
    </>
  )
}
