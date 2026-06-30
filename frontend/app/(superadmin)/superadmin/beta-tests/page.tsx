'use client'

import { useEffect, useRef, useState } from 'react'

type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'located'; lat: number; lng: number; accuracy: number; address?: string }
  | { status: 'error'; message: string }

export default function BetaTestsPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const marker = useRef<any>(null)
  const circle = useRef<any>(null)
  const [location, setLocation] = useState<LocationState>({ status: 'idle' })
  const [mapReady, setMapReady] = useState(false)

  // Dynamically import Leaflet (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined' || leafletMap.current) return

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      if (!mapRef.current || leafletMap.current) return

      // Fix default marker icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([51.505, -0.09], 5)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      leafletMap.current = map
      setMapReady(true)
    })
  }, [])

  function locate() {
    if (!navigator.geolocation) {
      setLocation({ status: 'error', message: 'Geolocation is not supported by this browser.' })
      return
    }

    setLocation({ status: 'loading' })

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords

        // Reverse geocode via Nominatim (no API key required)
        let address: string | undefined
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          address = data.display_name
        } catch {
          // silently ignore — address is optional
        }

        setLocation({ status: 'located', lat, lng, accuracy, address })

        if (leafletMap.current) {
          import('leaflet').then((L) => {
            const map = leafletMap.current

            // Clear previous marker / circle
            if (marker.current) map.removeLayer(marker.current)
            if (circle.current) map.removeLayer(circle.current)

            circle.current = L.circle([lat, lng], {
              radius: accuracy,
              color: '#4f46e5',
              fillColor: '#818cf8',
              fillOpacity: 0.15,
              weight: 1.5,
            }).addTo(map)

            marker.current = L.marker([lat, lng])
              .addTo(map)
              .bindPopup(
                `<strong>You are here</strong><br/>` +
                  `${lat.toFixed(5)}, ${lng.toFixed(5)}<br/>` +
                  `Accuracy: ±${Math.round(accuracy)} m` +
                  (address ? `<br/><span style="color:#555;font-size:11px">${address}</span>` : '')
              )
              .openPopup()

            map.flyTo([lat, lng], Math.max(14, 18 - Math.log2(accuracy / 10)), {
              duration: 1.5,
            })
          })
        }
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Permission denied — please allow location access in your browser.',
          2: 'Position unavailable — unable to determine your location.',
          3: 'Request timed out. Please try again.',
        }
        setLocation({ status: 'error', message: messages[err.code] ?? 'Unknown error.' })
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🧪</span>
          <h1 className="text-2xl font-bold text-gray-900">Beta Tests</h1>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            Experimental
          </span>
        </div>
        <p className="text-gray-500 text-sm">Sandbox for testing new features before rollout.</p>
      </div>

      {/* Geolocation card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">📍 Geolocation Map</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Pinpoint your current location on an interactive map.
            </p>
          </div>
          <button
            onClick={locate}
            disabled={location.status === 'loading' || !mapReady}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {location.status === 'loading' ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Locating…
              </>
            ) : (
              <>📍 Locate Me</>
            )}
          </button>
        </div>

        {/* Status strip */}
        {location.status === 'error' && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {location.message}
          </div>
        )}
        {location.status === 'located' && (
          <div className="px-6 py-3 bg-green-50 border-b border-green-100 text-green-800 text-sm flex flex-wrap gap-x-6 gap-y-1">
            <span>
              <strong>Lat:</strong> {location.lat.toFixed(6)}
            </span>
            <span>
              <strong>Lng:</strong> {location.lng.toFixed(6)}
            </span>
            <span>
              <strong>Accuracy:</strong> ±{Math.round(location.accuracy)} m
            </span>
            {location.address && (
              <span className="text-green-700 truncate max-w-xl">
                <strong>Address:</strong> {location.address}
              </span>
            )}
          </div>
        )}

        {/* Map */}
        <div ref={mapRef} style={{ height: 520 }} className="w-full" />

        {!mapReady && (
          <div className="flex items-center justify-center h-8 text-gray-400 text-xs -mt-8">
            Loading map…
          </div>
        )}
      </div>
    </div>
  )
}
