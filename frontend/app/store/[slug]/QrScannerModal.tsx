'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface Props {
  onScan: (productId: number, varId: number | null) => string | null
  onClose: () => void
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

export default function QrScannerModal({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const onScanRef = useRef(onScan)
  const lastRef = useRef<{ text: string; time: number }>({ text: '', time: 0 })
  const [ready, setReady] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { onScanRef.current = onScan }, [onScan])

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

      const parsed = parseQrText(text)
      if (!parsed) return

      const itemName = onScanRef.current(parsed.productId, parsed.varId)
      if (itemName) {
        setLastAdded(itemName)
        setCount(c => c + 1)
        setTimeout(() => setLastAdded(null), 2000)
      }
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

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
        <div>
          <p className="text-white font-bold text-sm">Scan item to basket</p>
          <p className="text-white/50 text-xs mt-0.5">
            {count > 0 ? `${count} item${count !== 1 ? 's' : ''} added` : 'Point camera at a menu QR code'}
          </p>
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
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-60 h-60 relative">
              {/* dim surround */}
              <div className="absolute -inset-[9999px] bg-black/45" />
              {/* clear box */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="w-full h-full" />
              </div>
              {/* corner brackets */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl" />
              {/* scan line */}
              <div className="absolute inset-x-4 top-1/2 h-0.5 bg-white/60 animate-pulse" />
            </div>
          </div>
        )}

        {/* Added toast */}
        {lastAdded && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-green-500 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-lg">
            ✓ {lastAdded} added to basket
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
        <p className="text-white/40 text-xs">Scanning continuously — tap ✕ when done</p>
      </div>
    </div>
  )
}
