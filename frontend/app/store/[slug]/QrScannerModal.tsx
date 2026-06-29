'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface Props {
  onLookup: (productId: number, varId: number | null) => string | null
  onConfirm: (productId: number, varId: number | null) => void
  onClose: () => void
}

interface Pending {
  productId: number
  varId: number | null
  name: string
}

function parseQrText(text: string): { productId: number; varId: number | null } | null {
  try {
    let params: URLSearchParams
    try {
      const url = new URL(text)
      params = url.searchParams
    } catch {
      params = new URLSearchParams(text.includes('?') ? text.split('?')[1] : text)
    }
    const add = params.get('add')
    if (!add) return null
    const v = params.get('v')
    return { productId: parseInt(add, 10), varId: v ? parseInt(v, 10) : null }
  } catch {
    return null
  }
}

export default function QrScannerModal({ onLookup, onConfirm, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const onLookupRef = useRef(onLookup)
  const lastRef = useRef<{ text: string; time: number }>({ text: '', time: 0 })
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { onLookupRef.current = onLookup }, [onLookup])

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let stopped = false

    reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
      if (!controlsRef.current) controlsRef.current = controls
      if (!result || stopped) return

      const text = result.getText()
      const now = Date.now()
      if (text === lastRef.current.text && now - lastRef.current.time < 2500) return
      lastRef.current = { text, time: now }

      // Don't process a new scan while a confirmation is pending
      setPending((current) => {
        if (current) return current
        const parsed = parseQrText(text)
        if (!parsed) return null
        const name = onLookupRef.current(parsed.productId, parsed.varId)
        if (!name) return null
        return { productId: parsed.productId, varId: parsed.varId, name }
      })
    }).then(controls => {
      controlsRef.current = controls
      setReady(true)
    }).catch(() => {
      setError('Camera access denied. Please allow camera access and try again.')
    })

    return () => {
      stopped = true
      controlsRef.current?.stop()
    }
  }, [])

  const handleAdd = () => {
    if (!pending) return
    onConfirm(pending.productId, pending.varId)
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      setPending(null)
      lastRef.current = { text: '', time: 0 }
    }, 1200)
  }

  const handleCancel = () => {
    setPending(null)
    lastRef.current = { text: '', time: 0 }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
        <div>
          <p className="text-white font-bold text-sm">Scan to order</p>
          <p className="text-white/50 text-xs mt-0.5">Point camera at a menu QR code</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Corner-bracket overlay */}
        {ready && !pending && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-60 h-60 relative">
              <div className="absolute -inset-[9999px] bg-black/45" />
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="w-full h-full" />
              </div>
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl" />
              <div className="absolute inset-x-4 top-1/2 h-0.5 bg-white/60 animate-pulse" />
            </div>
          </div>
        )}

        {/* Confirmation overlay */}
        {pending && (
          <div className="absolute inset-0 bg-black/70 flex items-end justify-center p-6">
            <div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4 shadow-2xl">
              {added ? (
                <div className="text-center py-2 space-y-2">
                  <p className="text-3xl">✅</p>
                  <p className="font-bold text-gray-900">Added to basket!</p>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Add to basket?</p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">{pending.name}</p>
                  </div>
                  <button
                    onClick={handleAdd}
                    className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl text-base hover:bg-gray-700 transition-colors"
                  >
                    Add to basket
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full text-gray-500 font-medium py-2 text-sm hover:text-gray-700 transition-colors"
                  >
                    Cancel — scan another
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/60 text-sm">Starting camera…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-4xl">📷</p>
            <p className="text-white font-semibold">{error}</p>
            <button onClick={onClose} className="bg-white/20 text-white px-5 py-2 rounded-xl text-sm">
              Close
            </button>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="bg-black/80 px-4 py-3 text-center shrink-0">
        <p className="text-white/40 text-xs">Tap ✕ when done scanning</p>
      </div>
    </div>
  )
}
