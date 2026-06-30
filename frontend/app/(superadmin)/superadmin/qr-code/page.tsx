'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

const PRESETS = [
  { label: 'Main site', url: 'https://eventifood.com' },
  { label: 'Register', url: 'https://eventifood.com/register' },
  { label: 'Login', url: 'https://eventifood.com/login' },
]

export default function QrCodePage() {
  const [url, setUrl] = useState('https://eventifood.com')
  const [size, setSize] = useState(400)
  const [margin, setMargin] = useState(2)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [svgData, setSvgData] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!url.trim()) return
    setError('')

    QRCode.toCanvas(canvasRef.current!, url, {
      width: size,
      margin,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).catch(() => setError('Invalid URL'))

    QRCode.toString(url, {
      type: 'svg',
      margin,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setSvgData).catch(() => {})
  }, [url, size, margin])

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'eventifood-qr.png'
    a.click()
  }

  const downloadSvg = () => {
    if (!svgData) return
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'eventifood-qr.svg'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>

      <div className="card space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input-field"
            placeholder="https://eventifood.com"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.url}
                onClick={() => setUrl(p.url)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  url === p.url
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Size (px): {size}</label>
            <input
              type="range"
              min={200}
              max={800}
              step={50}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Margin (modules): {margin}</label>
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card flex flex-col items-center gap-6">
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-md"
          style={{ maxWidth: '100%' }}
        />
        <p className="text-xs text-gray-400 font-mono break-all text-center">{url}</p>
        <div className="flex gap-3">
          <button
            onClick={downloadPng}
            disabled={!!error}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-40"
          >
            Download PNG
          </button>
          <button
            onClick={downloadSvg}
            disabled={!!error || !svgData}
            className="px-4 py-2 border border-gray-300 hover:border-brand-400 text-gray-700 hover:text-brand-600 text-sm font-medium rounded-lg disabled:opacity-40"
          >
            Download SVG
          </button>
        </div>
      </div>
    </div>
  )
}
