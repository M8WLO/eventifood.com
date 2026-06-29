'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export default function DisplayPage() {
  const [svg, setSvg] = useState<string | null>(null)
  const [storeName, setStoreName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [needsFullscreen, setNeedsFullscreen] = useState(true)

  useEffect(() => {
    api.get('/api/tenants/mine/').then((r) => {
      setSvg(r.data.qr_code_svg || null)
      setStoreName(r.data.name || '')
      setSlug(r.data.slug || '')
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 text-center">{storeName}</h1>

      {svg ? (
        <div
          className="w-[min(70vw,70vh)] h-[min(70vw,70vh)] [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="w-64 h-64 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
          <p className="text-gray-400 text-sm text-center px-4">QR code not generated yet.<br />Go to Settings to generate one.</p>
        </div>
      )}

      <div className="text-center space-y-1">
        <p className="text-3xl font-bold text-gray-700">Scan to order</p>
        {slug && (
          <p className="text-lg text-gray-400">{slug}.eventifood.com</p>
        )}
      </div>

      {needsFullscreen && (
        <div
          onClick={enterFullscreen}
          className="fixed inset-0 bg-black/50 z-10 flex items-end justify-center pb-16 cursor-pointer"
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
