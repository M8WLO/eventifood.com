'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

interface MenuItem {
  type: string; id: number; name: string; description: string
  price: string | null; photo: string | null; qr_code_svg: string
}
interface MenuData {
  id: number; name: string; size: string
  items: MenuItem[]; banner: string | null; store_name: string
  store_qr_code_svg: string | null
}

// A4 dimensions in mm
const A4_W_MM = 210
const A4_H_MM = 297

export default function PrintMenuPage() {
  const params = useParams()
  const id = params.id as string
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get(`/api/catalog/print-menus/${id}/render/`)
      .then((r) => { setMenu(r.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [id])

  const downloadPDF = async () => {
    if (!menuRef.current || !menu) return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const el = menuRef.current
      const scale = 2

      // Measure item card positions relative to the container BEFORE rendering.
      // getBoundingClientRect() is viewport-relative but the difference cancels out.
      const containerRect = el.getBoundingClientRect()
      const cardBounds = Array.from(el.querySelectorAll('.item-card')).map((card) => {
        const r = card.getBoundingClientRect()
        return {
          top: (r.top - containerRect.top) * scale,
          bottom: (r.bottom - containerRect.top) * scale,
        }
      })

      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      // px → mm conversion based on A4 width
      const pxToMm = A4_W_MM / canvas.width
      // A4 page height expressed in canvas pixels
      const pageHeightPx = A4_H_MM / pxToMm

      // Build page-cut Y positions that never slice through an item card.
      // For each natural cut point, if it lands inside a card, move it to that
      // card's top (pushing the card entirely to the next page).
      // Safety: if a card is taller than a full page we cut through it anyway.
      const cuts: number[] = [0]
      let pageStart = 0

      while (pageStart < canvas.height) {
        let pageEnd = pageStart + pageHeightPx
        if (pageEnd >= canvas.height) break

        // Find a card that straddles this cut (starts on current page, ends on next)
        const split = cardBounds.find(
          (c) => c.top > pageStart && c.top < pageEnd && c.bottom > pageEnd
        )
        if (split) pageEnd = split.top

        // Guard against zero-advance (card taller than a full page)
        if (pageEnd <= pageStart) pageEnd = pageStart + pageHeightPx

        cuts.push(pageEnd)
        pageStart = pageEnd
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      for (let i = 0; i < cuts.length; i++) {
        const sliceTopPx = cuts[i]
        const sliceBottomPx = i + 1 < cuts.length ? cuts[i + 1] : canvas.height
        const sliceHeightPx = sliceBottomPx - sliceTopPx
        const sliceHeightMm = sliceHeightPx * pxToMm

        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceHeightPx
        const ctx = sliceCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, sliceTopPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

        if (i > 0) pdf.addPage()
        pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_W_MM, sliceHeightMm)
      }

      pdf.save(`${menu.store_name} - ${menu.name}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

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
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="bg-gray-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
        <button
          onClick={() => window.print()}
          className="text-sm text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Print
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
      <div
        ref={menuRef}
        className="bg-white mx-auto my-6 shadow-xl no-print-shadow"
        style={{ maxWidth: '900px' }}
      >
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
            <p className="text-white/50 text-xs mt-1">Order on your phone — scan the QR code below</p>
          </div>
        </div>

        {/* Store QR hero */}
        {menu.store_qr_code_svg && (
          <div className="flex flex-col items-center py-6 px-8 border-b border-gray-200 bg-gray-50">
            <div
              className="[&>svg]:w-full [&>svg]:h-full bg-white rounded-xl border border-gray-200 p-2 shadow-sm"
              style={{ width: 150, height: 150 }}
              dangerouslySetInnerHTML={{ __html: menu.store_qr_code_svg }}
            />
            <p className="mt-3 text-sm font-medium text-gray-600 text-center max-w-xs">
              Scan this code to open the app, or scan any item below to start your order
            </p>
          </div>
        )}

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
              {/* Photo + QR row */}
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
                  <div className="shrink-0 bg-gray-200 flex items-center justify-center text-xs text-gray-400" style={{ width: 120 }}>
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
