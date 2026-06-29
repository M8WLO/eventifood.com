import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Eventifood — Food Van Software & QR Ordering App'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 45%, #1e1b4b 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Glow blobs ── */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: -60,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
          }}
        />

        {/* ── Bunting string ── */}
        <svg
          viewBox="0 0 1200 55"
          style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 55, opacity: 0.35 }}
        >
          <path
            d="M0 12 Q100 35 200 12 Q300 35 400 12 Q500 35 600 12 Q700 35 800 12 Q900 35 1000 12 Q1100 35 1200 12"
            stroke="#fbbf24"
            strokeWidth="2"
            fill="none"
          />
          {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map((x, i) => (
            <polygon
              key={x}
              points={`${x},34 ${x - 12},56 ${x + 12},56`}
              fill={i % 2 === 0 ? '#fbbf24' : '#a78bfa'}
            />
          ))}
        </svg>

        {/* ── Main layout ── */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', padding: '64px 80px 32px 80px', gap: 60 }}>

          {/* ── Left: Text content ── */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 24 }}>
            {/* Label */}
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                background: 'rgba(251,191,36,0.18)',
                border: '1px solid rgba(251,191,36,0.45)',
                borderRadius: 999,
                padding: '6px 20px',
                color: '#fbbf24',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              FOOD VAN SOFTWARE
            </div>

            {/* Brand name */}
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: 'white',
                lineHeight: 1,
                letterSpacing: -3,
              }}
            >
              Eventifood
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize: 28,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.35,
                maxWidth: 480,
              }}
            >
              QR ordering, kitchen display &amp; queue management for food trucks
            </div>

            {/* Pills */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              {['No monthly fee', 'No app for customers', 'Live in 30 minutes'].map((label) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 999,
                    padding: '10px 22px',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  ✓ {label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Food truck illustration ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg
              viewBox="0 0 340 240"
              style={{ width: 340, height: 240 }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Van body */}
              <rect x="8" y="85" width="260" height="105" rx="12" fill="white" fillOpacity="0.15" />
              {/* Cab */}
              <rect x="240" y="60" width="86" height="130" rx="12" fill="white" fillOpacity="0.22" />
              {/* Cab window */}
              <rect x="252" y="72" width="62" height="54" rx="6" fill="white" fillOpacity="0.3" />
              {/* Awning */}
              <path d="M18 88 L165 88 L150 65 L30 65 Z" fill="#fbbf24" fillOpacity="0.85" />
              {/* Awning stripes */}
              <line x1="62" y1="65" x2="56" y2="88" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="92" y1="65" x2="87" y2="88" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="122" y1="65" x2="117" y2="88" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
              <line x1="148" y1="67" x2="144" y2="88" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
              {/* Service window */}
              <rect x="24" y="94" width="118" height="66" rx="5" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
              {/* Hatch counter */}
              <rect x="24" y="145" width="118" height="8" rx="2" fill="white" fillOpacity="0.18" />
              {/* Chef / steam */}
              <ellipse cx="65" cy="128" rx="12" ry="8" fill="#fbbf24" fillOpacity="0.7" />
              <ellipse cx="100" cy="124" rx="14" ry="9" fill="#fbbf24" fillOpacity="0.55" />
              {/* QR code motif */}
              <rect x="145" y="100" width="60" height="60" rx="4" fill="white" fillOpacity="0.85" />
              <rect x="150" y="105" width="22" height="22" rx="2" fill="#4c1d95" />
              <rect x="178" y="105" width="22" height="22" rx="2" fill="#4c1d95" />
              <rect x="150" y="133" width="22" height="22" rx="2" fill="#4c1d95" />
              <rect x="153" y="108" width="16" height="16" rx="1" fill="white" />
              <rect x="181" y="108" width="16" height="16" rx="1" fill="white" />
              <rect x="153" y="136" width="16" height="16" rx="1" fill="white" />
              <rect x="157" y="112" width="8" height="8" fill="#4c1d95" />
              <rect x="185" y="112" width="8" height="8" fill="#4c1d95" />
              <rect x="157" y="140" width="8" height="8" fill="#4c1d95" />
              <rect x="178" y="133" width="5" height="5" fill="#4c1d95" />
              <rect x="185" y="133" width="5" height="5" fill="#4c1d95" />
              <rect x="178" y="140" width="5" height="5" fill="#4c1d95" />
              <rect x="185" y="140" width="5" height="5" fill="#4c1d95" />
              {/* Wheels */}
              <circle cx="75" cy="188" r="28" fill="#1f2937" />
              <circle cx="75" cy="188" r="17" fill="#374151" />
              <circle cx="75" cy="188" r="7" fill="#6b7280" />
              <circle cx="262" cy="188" r="28" fill="#1f2937" />
              <circle cx="262" cy="188" r="17" fill="#374151" />
              <circle cx="262" cy="188" r="7" fill="#6b7280" />
              {/* Ground shadow */}
              <ellipse cx="170" cy="218" rx="150" ry="8" fill="black" fillOpacity="0.25" />
              {/* Stars */}
              <text x="20" y="50" fontSize="18" fill="#fbbf24" fillOpacity="0.7">★</text>
              <text x="190" y="38" fontSize="14" fill="#a78bfa" fillOpacity="0.8">★</text>
              <text x="310" y="52" fontSize="20" fill="#fbbf24" fillOpacity="0.6">★</text>
            </svg>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.35)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '18px 80px',
          }}
        >
          <div style={{ display: 'flex', gap: 48 }}>
            {[
              { stat: '6×', label: 'faster queue throughput' },
              { stat: '2%', label: 'per transaction only' },
              { stat: '£0', label: 'monthly fee ever' },
            ].map(({ stat, label }) => (
              <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: '#fbbf24' }}>{stat}</span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 0.5,
            }}
          >
            eventifood.com
          </div>
        </div>

      </div>
    ),
    { ...size }
  )
}
