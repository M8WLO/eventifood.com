'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState, useCallback } from 'react'
import api from '@/lib/api'

interface Trader {
  id: number
  name: string
  slug: string
  is_active: boolean
  is_demo: boolean
  latitude: number | null
  longitude: number | null
  trial_expires_at: string | null
}

export default function TradersMapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const pendingMarkerRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [traders, setTraders] = useState<Trader[]>([])
  const [selected, setSelected] = useState<Trader | null>(null)
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadTraders = useCallback(async () => {
    try {
      const r = await api.get('/api/tenants/map/')
      setTraders(r.data)
    } catch {
      setError('Failed to load traders')
    }
  }, [])

  useEffect(() => { loadTraders() }, [loadTraders])

  // Init Leaflet
  useEffect(() => {
    if (typeof window === 'undefined' || leafletMap.current) return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      if (!mapRef.current || leafletMap.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([54.5, -3.0], 6) // UK centre

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      leafletMap.current = map
      setMapReady(true)
    })
  }, [])

  // Sync markers whenever traders list changes
  useEffect(() => {
    if (!mapReady || !leafletMap.current) return
    import('leaflet').then((L) => {
      const map = leafletMap.current

      // Remove stale markers
      Object.keys(markersRef.current).forEach(slug => {
        if (!traders.find(t => t.slug === slug)) {
          map.removeLayer(markersRef.current[slug])
          delete markersRef.current[slug]
        }
      })

      traders.forEach(trader => {
        if (trader.latitude == null || trader.longitude == null) {
          if (markersRef.current[trader.slug]) {
            map.removeLayer(markersRef.current[trader.slug])
            delete markersRef.current[trader.slug]
          }
          return
        }

        const color = trader.is_demo ? '#6366f1' : trader.is_active ? '#16a34a' : '#9ca3af'
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:14px;height:14px;border-radius:50%;
            background:${color};border:2px solid #fff;
            box-shadow:0 1px 4px rgba(0,0,0,0.4);
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })

        if (markersRef.current[trader.slug]) {
          markersRef.current[trader.slug].setLatLng([trader.latitude, trader.longitude])
          markersRef.current[trader.slug].setIcon(icon)
        } else {
          const marker = L.marker([trader.latitude, trader.longitude], { icon })
            .addTo(map)
            .bindPopup(`
              <strong>${trader.name}</strong><br/>
              <span style="color:#6b7280;font-size:12px">${trader.slug}</span><br/>
              <a href="https://${trader.slug}.eventifood.com" target="_blank"
                 style="font-size:12px;color:#2563eb">Open store ↗</a>
            `)
          markersRef.current[trader.slug] = marker
        }
      })
    })
  }, [traders, mapReady])

  // Map click handler — only active when a trader is selected for placement
  useEffect(() => {
    if (!mapReady || !leafletMap.current) return
    const map = leafletMap.current

    const onClick = (e: any) => {
      if (!selected) return
      import('leaflet').then((L) => {
        if (pendingMarkerRef.current) map.removeLayer(pendingMarkerRef.current)
        const m = L.marker([e.latlng.lat, e.latlng.lng], { draggable: true })
          .addTo(map)
          .bindPopup(`📍 New location for <strong>${selected.name}</strong>`)
          .openPopup()
        m.on('dragend', (de: any) => {
          const pos = de.target.getLatLng()
          setPendingLatLng({ lat: pos.lat, lng: pos.lng })
        })
        pendingMarkerRef.current = m
        setPendingLatLng({ lat: e.latlng.lat, lng: e.latlng.lng })
      })
    }

    map.on('click', onClick)
    return () => map.off('click', onClick)
  }, [mapReady, selected])

  const selectTrader = (trader: Trader) => {
    setSelected(trader)
    setPendingLatLng(null)
    if (pendingMarkerRef.current && leafletMap.current) {
      leafletMap.current.removeLayer(pendingMarkerRef.current)
      pendingMarkerRef.current = null
    }
    setError('')
    // Fly to existing marker if it has one
    if (trader.latitude != null && trader.longitude != null && leafletMap.current) {
      leafletMap.current.flyTo([trader.latitude, trader.longitude], 14, { duration: 1 })
    }
  }

  const cancelSelection = () => {
    setSelected(null)
    setPendingLatLng(null)
    if (pendingMarkerRef.current && leafletMap.current) {
      leafletMap.current.removeLayer(pendingMarkerRef.current)
      pendingMarkerRef.current = null
    }
  }

  const saveLocation = async () => {
    if (!selected || !pendingLatLng) return
    setSaving(true)
    setError('')
    try {
      await api.patch(`/api/tenants/admin/${selected.slug}/location/`, pendingLatLng)
      setTraders(ts => ts.map(t =>
        t.slug === selected.slug
          ? { ...t, latitude: pendingLatLng.lat, longitude: pendingLatLng.lng }
          : t
      ))
      setSelected(null)
      setPendingLatLng(null)
      if (pendingMarkerRef.current && leafletMap.current) {
        leafletMap.current.removeLayer(pendingMarkerRef.current)
        pendingMarkerRef.current = null
      }
    } catch {
      setError('Failed to save location')
    } finally {
      setSaving(false)
    }
  }

  const clearLocation = async (trader: Trader) => {
    if (!confirm(`Remove location pin for ${trader.name}?`)) return
    try {
      await api.patch(`/api/tenants/admin/${trader.slug}/location/`, { latitude: null, longitude: null })
      setTraders(ts => ts.map(t =>
        t.slug === trader.slug ? { ...t, latitude: null, longitude: null } : t
      ))
      if (selected?.slug === trader.slug) cancelSelection()
    } catch {
      setError('Failed to clear location')
    }
  }

  const pinned = traders.filter(t => t.latitude != null)
  const filtered = traders.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div className="w-72 shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Traders Map</h1>
          <p className="text-xs text-gray-500 mt-0.5">{pinned.length} of {traders.length} pinned</p>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search traders…"
            className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {selected && (
          <div className="px-4 py-3 bg-brand-50 border-b border-brand-200 text-sm">
            <p className="font-semibold text-brand-800">Placing: {selected.name}</p>
            {pendingLatLng ? (
              <p className="text-xs text-brand-600 mt-0.5">
                {pendingLatLng.lat.toFixed(5)}, {pendingLatLng.lng.toFixed(5)}
              </p>
            ) : (
              <p className="text-xs text-brand-600 mt-0.5">Click the map to place pin</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={saveLocation}
                disabled={!pendingLatLng || saving}
                className="flex-1 bg-brand-600 text-white text-xs font-semibold py-1.5 rounded-lg disabled:opacity-40 hover:bg-brand-700"
              >
                {saving ? 'Saving…' : '✓ Save'}
              </button>
              <button
                onClick={cancelSelection}
                className="flex-1 border border-gray-300 text-gray-600 text-xs font-semibold py-1.5 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100">{error}</div>
        )}

        <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.map(trader => {
            const hasPen = trader.latitude != null
            const isSelected = selected?.slug === trader.slug
            return (
              <li
                key={trader.slug}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => selectTrader(trader)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{
                      background: hasPen
                        ? (trader.is_demo ? '#6366f1' : '#16a34a')
                        : '#d1d5db',
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{trader.name}</div>
                    <div className="text-xs text-gray-400 truncate">{trader.slug}</div>
                  </div>
                </div>
                {hasPen && (
                  <button
                    onClick={e => { e.stopPropagation(); clearLocation(trader) }}
                    className="shrink-0 ml-2 text-gray-300 hover:text-red-400 text-xs"
                    title="Remove pin"
                  >
                    ✕
                  </button>
                )}
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-400 text-sm">No traders found</li>
          )}
        </ul>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-500 mb-1">Legend</p>
          {[
            { color: '#16a34a', label: 'Active' },
            { color: '#6366f1', label: 'Demo' },
            { color: '#d1d5db', label: 'No pin set' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {selected && !pendingLatLng && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-lg rounded-xl px-5 py-2.5 text-sm font-medium text-brand-700 border border-brand-200 pointer-events-none">
            Click anywhere on the map to place <strong>{selected.name}</strong>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
            Loading map…
          </div>
        )}
      </div>
    </div>
  )
}
