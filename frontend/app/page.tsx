import Image from 'next/image'
import Link from 'next/link'
import PricingSection from './(platform)/pricing-section'

const features = [
  {
    icon: '🏪',
    title: 'Your Own Branded Store',
    desc: 'Get a fully branded online storefront at yourname.eventifood.com — no tech skills needed. Upload your logo, choose your colours, and you\'re open for orders.',
  },
  {
    icon: '📱',
    title: 'QR Code Ordering',
    desc: 'Customers scan a QR code at your van, browse your full menu on their phone and place their order in seconds — no app download, no fuss.',
  },
  {
    icon: '🍳',
    title: 'Live Kitchen Board',
    desc: 'Every new order lands instantly on your kitchen screen. Mark items ready with a single tap and keep your team in perfect sync at peak service.',
  },
  {
    icon: '📊',
    title: 'Profit & Sales Tracking',
    desc: 'See your best-selling items, daily revenue, and wastage figures at a glance. Make smarter menu decisions backed by real numbers.',
  },
  {
    icon: '🔒',
    title: 'Secure Multi-Factor Login',
    desc: 'Every seller account is protected with email MFA — so only you can access your dashboard, even if your password is ever compromised.',
  },
  {
    icon: '📦',
    title: 'Inventory Management',
    desc: 'Set stock levels per item, track what\'s running low, and automatically hide sold-out items from your menu so customers only see what\'s available.',
  },
]

const buyerSteps = [
  { step: '1', title: 'Scan the QR code', desc: 'At the van, on a flyer, or in an event programme — one scan opens your full menu.' },
  { step: '2', title: 'Browse & add to basket', desc: 'Pick your items, customise options, and review your order before paying.' },
  { step: '3', title: 'Pay securely', desc: 'Card or mobile payment processed in seconds. No cash, no waiting.' },
  { step: '4', title: 'Track your order live', desc: 'Watch your order move from Received → Preparing → Ready — right on your phone.' },
]

const testimonials = [
  {
    quote: 'Since switching to Eventifood our queue time halved. Customers love scanning the QR and we\'re handling 40% more orders at peak.',
    name: 'Sarah M.',
    van: 'The Sizzle Shack',
  },
  {
    quote: 'Setting up took 20 minutes. The kitchen board is brilliant — my staff don\'t miss a single order even when it\'s manic.',
    name: 'Tom K.',
    van: 'Kogi Street',
  },
  {
    quote: 'The analytics showed me my loaded fries outsell plain fries 3-to-1. I dropped plain fries and my margins went up overnight.',
    name: 'Priya R.',
    van: 'Spice Route',
  },
]

const whyUs = [
  { icon: '⚡', text: 'Up and running in under 30 minutes' },
  { icon: '📱', text: 'No app for customers to download' },
  { icon: '💳', text: 'Secure card & mobile payments built-in' },
  { icon: '🌐', text: 'Works at any event, market or festival' },
  { icon: '📶', text: 'Works on basic mobile data' },
  { icon: '🛡️', text: 'MFA-protected seller accounts' },
  { icon: '🎨', text: 'Fully branded to your van\'s identity' },
  { icon: '📈', text: 'Real-time order & profit visibility' },
]

/* ─── Inline SVG illustration components ─── */

function FoodTruckSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 200" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* Van body */}
      <rect x="8" y="65" width="260" height="95" rx="10" fill="currentColor" opacity="0.85" />
      {/* Cab section */}
      <rect x="240" y="44" width="80" height="116" rx="10" fill="currentColor" opacity="1" />
      {/* Windscreen */}
      <rect x="250" y="55" width="58" height="50" rx="5" fill="white" opacity="0.25" />
      {/* Windscreen glare */}
      <line x1="254" y1="58" x2="260" y2="100" stroke="white" strokeWidth="1.5" opacity="0.3" />
      {/* Awning over serving window */}
      <path d="M18 68 L155 68 L142 50 L30 50 Z" fill="#F5A623" />
      <line x1="55" y1="50" x2="50" y2="68" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="82" y1="50" x2="77" y2="68" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="109" y1="50" x2="104" y2="68" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="135" y1="50" x2="130" y2="68" stroke="white" strokeWidth="2" opacity="0.5" />
      {/* Serving window frame */}
      <rect x="25" y="72" width="108" height="60" rx="4" fill="white" opacity="0.18" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Counter shelf */}
      <rect x="25" y="125" width="108" height="7" rx="2" fill="white" opacity="0.15" />
      {/* Chef hand in window */}
      <ellipse cx="60" cy="118" rx="10" ry="7" fill="#F5A623" opacity="0.6" />
      <ellipse cx="90" cy="115" rx="12" ry="8" fill="#F5A623" opacity="0.5" />
      {/* Side panel text area */}
      <rect x="160" y="82" width="68" height="30" rx="4" fill="white" opacity="0.12" />
      {/* Wheel arches */}
      <ellipse cx="75" cy="160" rx="35" ry="12" fill="black" opacity="0.15" />
      <ellipse cx="255" cy="160" rx="35" ry="12" fill="black" opacity="0.15" />
      {/* Wheels */}
      <circle cx="75" cy="158" r="28" fill="#1f2937" />
      <circle cx="75" cy="158" r="16" fill="#374151" />
      <circle cx="75" cy="158" r="7" fill="#6b7280" />
      <line x1="75" y1="142" x2="75" y2="174" stroke="#4b5563" strokeWidth="3" />
      <line x1="59" y1="158" x2="91" y2="158" stroke="#4b5563" strokeWidth="3" />
      <circle cx="255" cy="158" r="28" fill="#1f2937" />
      <circle cx="255" cy="158" r="16" fill="#374151" />
      <circle cx="255" cy="158" r="7" fill="#6b7280" />
      <line x1="255" y1="142" x2="255" y2="174" stroke="#4b5563" strokeWidth="3" />
      <line x1="239" y1="158" x2="271" y2="158" stroke="#4b5563" strokeWidth="3" />
      {/* Chassis rail */}
      <rect x="50" y="152" width="270" height="6" rx="3" fill="#374151" />
      {/* Chimney */}
      <rect x="180" y="40" width="8" height="28" rx="3" fill="#374151" />
      {/* Steam puffs */}
      <circle cx="184" cy="34" r="7" fill="white" opacity="0.35" />
      <circle cx="178" cy="24" r="6" fill="white" opacity="0.25" />
      <circle cx="188" cy="16" r="5" fill="white" opacity="0.18" />
      {/* Roof sign */}
      <rect x="30" y="38" width="100" height="18" rx="4" fill="#F5A623" opacity="0.9" />
      <rect x="34" y="41" width="92" height="12" rx="2" fill="#d97706" opacity="0.4" />
      {/* Bunting flags on roof */}
      <path d="M30 38 L60 28 L90 38 L120 28 L150 38" stroke="#F5A623" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />
      <polygon points="58,28 48,40 68,40" fill="#ef4444" opacity="0.7" />
      <polygon points="88,28 78,40 98,40" fill="#3b82f6" opacity="0.7" />
      <polygon points="118,28 108,40 128,40" fill="#22c55e" opacity="0.7" />
    </svg>
  )
}

function CrowdSilhouetteSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 120" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
      {/* Back row — shorter, lighter */}
      <ellipse cx="30" cy="95" rx="18" ry="24" fill="currentColor" opacity="0.3" />
      <ellipse cx="72" cy="90" rx="16" ry="22" fill="currentColor" opacity="0.25" />
      <ellipse cx="112" cy="93" rx="17" ry="26" fill="currentColor" opacity="0.28" />
      <ellipse cx="155" cy="88" rx="15" ry="21" fill="currentColor" opacity="0.3" />
      <ellipse cx="195" cy="92" rx="18" ry="25" fill="currentColor" opacity="0.25" />
      <ellipse cx="238" cy="87" rx="16" ry="23" fill="currentColor" opacity="0.28" />
      <ellipse cx="278" cy="91" rx="17" ry="24" fill="currentColor" opacity="0.3" />
      <ellipse cx="320" cy="86" rx="16" ry="22" fill="currentColor" opacity="0.25" />
      <ellipse cx="362" cy="90" rx="18" ry="26" fill="currentColor" opacity="0.28" />
      <ellipse cx="404" cy="87" rx="15" ry="22" fill="currentColor" opacity="0.3" />
      <ellipse cx="446" cy="92" rx="17" ry="24" fill="currentColor" opacity="0.25" />
      <ellipse cx="488" cy="88" rx="16" ry="23" fill="currentColor" opacity="0.28" />
      <ellipse cx="530" cy="91" rx="18" ry="25" fill="currentColor" opacity="0.3" />
      <ellipse cx="572" cy="86" rx="15" ry="21" fill="currentColor" opacity="0.25" />
      <ellipse cx="614" cy="93" rx="17" ry="26" fill="currentColor" opacity="0.28" />
      <ellipse cx="656" cy="89" rx="16" ry="23" fill="currentColor" opacity="0.3" />
      <ellipse cx="698" cy="91" rx="18" ry="24" fill="currentColor" opacity="0.25" />
      <ellipse cx="740" cy="87" rx="15" ry="22" fill="currentColor" opacity="0.28" />
      <ellipse cx="780" cy="93" rx="17" ry="25" fill="currentColor" opacity="0.3" />
      {/* Front row — taller, darker, with raised hands */}
      <ellipse cx="50" cy="108" rx="20" ry="30" fill="currentColor" opacity="0.55" />
      <line x1="50" y1="82" x2="40" y2="60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="95" cy="105" rx="19" ry="28" fill="currentColor" opacity="0.5" />
      <ellipse cx="140" cy="110" rx="21" ry="32" fill="currentColor" opacity="0.55" />
      <line x1="140" y1="80" x2="152" y2="55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="185" cy="106" rx="18" ry="27" fill="currentColor" opacity="0.5" />
      <ellipse cx="230" cy="109" rx="20" ry="30" fill="currentColor" opacity="0.55" />
      <line x1="230" y1="82" x2="218" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="275" cy="104" rx="19" ry="28" fill="currentColor" opacity="0.5" />
      <ellipse cx="320" cy="110" rx="21" ry="31" fill="currentColor" opacity="0.55" />
      <ellipse cx="366" cy="106" rx="18" ry="28" fill="currentColor" opacity="0.5" />
      <line x1="366" y1="80" x2="378" y2="56" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="412" cy="108" rx="20" ry="30" fill="currentColor" opacity="0.55" />
      <ellipse cx="458" cy="105" rx="19" ry="27" fill="currentColor" opacity="0.5" />
      <line x1="458" y1="80" x2="446" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="504" cy="110" rx="21" ry="32" fill="currentColor" opacity="0.55" />
      <ellipse cx="550" cy="106" rx="18" ry="28" fill="currentColor" opacity="0.5" />
      <ellipse cx="596" cy="109" rx="20" ry="30" fill="currentColor" opacity="0.55" />
      <line x1="596" y1="82" x2="608" y2="57" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="642" cy="104" rx="19" ry="27" fill="currentColor" opacity="0.5" />
      <ellipse cx="688" cy="109" rx="21" ry="31" fill="currentColor" opacity="0.55" />
      <line x1="688" y1="80" x2="676" y2="56" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="734" cy="106" rx="18" ry="28" fill="currentColor" opacity="0.5" />
      <ellipse cx="778" cy="110" rx="20" ry="30" fill="currentColor" opacity="0.55" />
    </svg>
  )
}

function QueueSilhouetteSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 160" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* Ground line */}
      <line x1="0" y1="148" x2="420" y2="148" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      {/* Person 1 — excited, holding phone */}
      <circle cx="50" cy="50" r="18" fill="currentColor" opacity="0.7" />
      <rect x="36" y="68" width="28" height="42" rx="6" fill="currentColor" opacity="0.65" />
      <rect x="54" y="55" width="14" height="10" rx="2" fill="currentColor" opacity="0.4" />
      <line x1="64" y1="85" x2="80" y2="75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <line x1="36" y1="85" x2="20" y2="92" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <line x1="50" y1="110" x2="42" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <line x1="50" y1="110" x2="58" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      {/* Person 2 — tall */}
      <circle cx="120" cy="42" r="20" fill="currentColor" opacity="0.65" />
      <rect x="104" y="62" width="32" height="48" rx="6" fill="currentColor" opacity="0.6" />
      <line x1="104" y1="80" x2="86" y2="70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <line x1="136" y1="82" x2="154" y2="88" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <line x1="116" y1="110" x2="108" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <line x1="124" y1="110" x2="132" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      {/* Person 3 — checking phone */}
      <circle cx="192" cy="52" r="17" fill="currentColor" opacity="0.7" />
      <rect x="178" y="69" width="28" height="40" rx="6" fill="currentColor" opacity="0.65" />
      <rect x="165" y="78" width="13" height="18" rx="2" fill="currentColor" opacity="0.5" />
      <line x1="178" y1="82" x2="165" y2="80" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <line x1="206" y1="82" x2="222" y2="76" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <line x1="188" y1="109" x2="180" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <line x1="196" y1="109" x2="204" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      {/* Person 4 — short */}
      <circle cx="256" cy="62" r="15" fill="currentColor" opacity="0.6" />
      <rect x="243" y="77" width="26" height="35" rx="5" fill="currentColor" opacity="0.55" />
      <line x1="243" y1="88" x2="228" y2="96" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      <line x1="269" y1="88" x2="284" y2="82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      <line x1="250" y1="112" x2="244" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <line x1="262" y1="112" x2="268" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      {/* Person 5 */}
      <circle cx="318" cy="48" r="19" fill="currentColor" opacity="0.65" />
      <rect x="303" y="67" width="30" height="44" rx="6" fill="currentColor" opacity="0.6" />
      <line x1="303" y1="82" x2="286" y2="74" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <line x1="333" y1="80" x2="350" y2="68" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <line x1="312" y1="111" x2="304" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <line x1="324" y1="111" x2="332" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      {/* Person 6 */}
      <circle cx="378" cy="55" r="16" fill="currentColor" opacity="0.6" />
      <rect x="364" y="71" width="28" height="38" rx="5" fill="currentColor" opacity="0.55" />
      <line x1="364" y1="85" x2="348" y2="90" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      <line x1="392" y1="84" x2="408" y2="78" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      <line x1="372" y1="109" x2="364" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <line x1="384" y1="109" x2="392" y2="148" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      {/* Dotted queue line */}
      <line x1="0" y1="148" x2="420" y2="148" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" opacity="0.18" />
    </svg>
  )
}

function FestivalStageSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 200" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* Stage platform */}
      <rect x="100" y="130" width="400" height="20" rx="4" fill="currentColor" opacity="0.4" />
      <rect x="80" y="148" width="440" height="12" rx="3" fill="currentColor" opacity="0.25" />
      {/* Stage back wall */}
      <rect x="110" y="50" width="380" height="82" rx="4" fill="currentColor" opacity="0.12" />
      {/* Left truss tower */}
      <rect x="108" y="20" width="16" height="114" rx="2" fill="currentColor" opacity="0.4" />
      <line x1="112" y1="30" x2="120" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="120" y1="30" x2="112" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="112" y1="50" x2="120" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="120" y1="50" x2="112" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="112" y1="70" x2="120" y2="80" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="120" y1="70" x2="112" y2="80" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="112" y1="90" x2="120" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      {/* Right truss tower */}
      <rect x="476" y="20" width="16" height="114" rx="2" fill="currentColor" opacity="0.4" />
      <line x1="480" y1="30" x2="488" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="488" y1="30" x2="480" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="480" y1="50" x2="488" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="488" y1="50" x2="480" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="480" y1="70" x2="488" y2="80" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <line x1="488" y1="70" x2="480" y2="80" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      {/* Top roof bar */}
      <rect x="108" y="16" width="384" height="8" rx="2" fill="currentColor" opacity="0.45" />
      {/* Spotlights */}
      <polygon points="140,24 128,130 152,130" fill="currentColor" opacity="0.06" />
      <polygon points="220,24 200,130 240,130" fill="currentColor" opacity="0.06" />
      <polygon points="300,24 278,130 322,130" fill="currentColor" opacity="0.06" />
      <polygon points="380,24 360,130 400,130" fill="currentColor" opacity="0.06" />
      <polygon points="460,24 448,130 472,130" fill="currentColor" opacity="0.06" />
      {/* Spotlight heads */}
      <rect x="133" y="14" width="14" height="8" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="213" y="14" width="14" height="8" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="293" y="14" width="14" height="8" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="373" y="14" width="14" height="8" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="453" y="14" width="14" height="8" rx="2" fill="currentColor" opacity="0.6" />
      {/* Stage acts — 3 figure silhouettes */}
      <ellipse cx="260" cy="105" rx="12" ry="12" fill="currentColor" opacity="0.45" />
      <rect x="250" y="117" width="20" height="30" rx="4" fill="currentColor" opacity="0.4" />
      <line x1="250" y1="125" x2="234" y2="118" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="270" y1="123" x2="282" y2="110" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="255" y1="147" x2="250" y2="162" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <line x1="265" y1="147" x2="270" y2="162" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <ellipse cx="300" cy="100" rx="13" ry="13" fill="currentColor" opacity="0.45" />
      <rect x="289" y="113" width="22" height="32" rx="4" fill="currentColor" opacity="0.4" />
      <line x1="289" y1="120" x2="272" y2="110" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="311" y1="118" x2="325" y2="104" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="295" y1="145" x2="288" y2="162" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <line x1="305" y1="145" x2="312" y2="162" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <ellipse cx="340" cy="107" rx="11" ry="11" fill="currentColor" opacity="0.45" />
      <rect x="330" y="118" width="20" height="28" rx="4" fill="currentColor" opacity="0.4" />
      <line x1="330" y1="126" x2="318" y2="135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="350" y1="124" x2="362" y2="116" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      {/* Music notes floating */}
      <text x="170" y="90" fontSize="16" fill="currentColor" opacity="0.35">♪</text>
      <text x="395" y="80" fontSize="20" fill="currentColor" opacity="0.3">♫</text>
      <text x="420" y="100" fontSize="14" fill="currentColor" opacity="0.25">♩</text>
      <text x="155" y="110" fontSize="12" fill="currentColor" opacity="0.28">♬</text>
      {/* Crowd below stage */}
      <ellipse cx="150" cy="178" rx="16" ry="20" fill="currentColor" opacity="0.35" />
      <line x1="150" y1="160" x2="140" y2="140" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <ellipse cx="195" cy="175" rx="15" ry="18" fill="currentColor" opacity="0.3" />
      <ellipse cx="240" cy="180" rx="16" ry="20" fill="currentColor" opacity="0.35" />
      <line x1="240" y1="162" x2="252" y2="142" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <ellipse cx="285" cy="176" rx="15" ry="19" fill="currentColor" opacity="0.3" />
      <ellipse cx="330" cy="179" rx="16" ry="20" fill="currentColor" opacity="0.35" />
      <ellipse cx="375" cy="174" rx="15" ry="18" fill="currentColor" opacity="0.3" />
      <line x1="375" y1="158" x2="363" y2="140" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <ellipse cx="420" cy="178" rx="16" ry="20" fill="currentColor" opacity="0.35" />
      <ellipse cx="465" cy="175" rx="15" ry="19" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

function MusicNotesSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="45" fontSize="28" fill="currentColor" opacity="0.4" transform="rotate(-15,30,45)">♪</text>
      <text x="60" y="30" fontSize="20" fill="currentColor" opacity="0.3" transform="rotate(8,70,30)">♫</text>
      <text x="110" y="55" fontSize="32" fill="currentColor" opacity="0.35" transform="rotate(-8,126,55)">♩</text>
      <text x="155" y="35" fontSize="22" fill="currentColor" opacity="0.28" transform="rotate(12,166,35)">♬</text>
      <text x="35" y="85" fontSize="18" fill="currentColor" opacity="0.25" transform="rotate(5,44,85)">♪</text>
      <text x="90" y="100" fontSize="24" fill="currentColor" opacity="0.3" transform="rotate(-10,102,100)">♫</text>
      <text x="145" y="90" fontSize="16" fill="currentColor" opacity="0.22" transform="rotate(15,153,90)">♩</text>
    </svg>
  )
}

function BuntingSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 60" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* String */}
      <path d="M0 10 Q50 30 100 10 Q150 30 200 10 Q250 30 300 10 Q350 30 400 10 Q450 30 500 10 Q550 30 600 10 Q650 30 700 10 Q750 30 800 10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Flags — alternating colours via opacity tricks */}
      <polygon points="50,29 40,55 60,55" fill="currentColor" opacity="0.5" />
      <polygon points="100,9 90,35 110,35" fill="currentColor" opacity="0.3" />
      <polygon points="150,29 140,55 160,55" fill="currentColor" opacity="0.5" />
      <polygon points="200,9 190,35 210,35" fill="currentColor" opacity="0.3" />
      <polygon points="250,29 240,55 260,55" fill="currentColor" opacity="0.5" />
      <polygon points="300,9 290,35 310,35" fill="currentColor" opacity="0.3" />
      <polygon points="350,29 340,55 360,55" fill="currentColor" opacity="0.5" />
      <polygon points="400,9 390,35 410,35" fill="currentColor" opacity="0.3" />
      <polygon points="450,29 440,55 460,55" fill="currentColor" opacity="0.5" />
      <polygon points="500,9 490,35 510,35" fill="currentColor" opacity="0.3" />
      <polygon points="550,29 540,55 560,55" fill="currentColor" opacity="0.5" />
      <polygon points="600,9 590,35 610,35" fill="currentColor" opacity="0.3" />
      <polygon points="650,29 640,55 660,55" fill="currentColor" opacity="0.5" />
      <polygon points="700,9 690,35 710,35" fill="currentColor" opacity="0.3" />
      <polygon points="750,29 740,55 760,55" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-purple-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Eventifood" width={280} height={96} className="h-20 w-auto" priority />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold-400 blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-gold-500 blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        {/* Food truck illustration — right side */}
        <FoodTruckSVG className="absolute right-0 bottom-12 w-80 xl:w-96 text-white opacity-20 pointer-events-none hidden lg:block" />
        {/* Music notes — left float */}
        <MusicNotesSVG className="absolute left-4 top-24 w-40 text-white pointer-events-none hidden md:block" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
              Now in beta — free for early sellers
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Your food van.<br />
              <span className="text-gold-400">Your own store at</span><br />
              <span className="text-gold-300 text-3xl sm:text-4xl font-mono">yourname.eventifood.com</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-10">
              Register in minutes and get a fully branded QR-code ordering store on your own subdomain — live kitchen board, profit tracking, inventory management and secure MFA. Open for business in 30 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-gold-500 hover:bg-gold-600 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all">
                Open your store free →
              </Link>
              <a href="#how-it-works" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-lg py-4 px-8 rounded-xl transition-all">
                See how it works
              </a>
            </div>
            <p className="mt-6 text-sm text-purple-200">No credit card required. Up and running in 30 minutes.</p>
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 240 60 0 20L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-10 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-gray-400 font-medium uppercase tracking-widest mb-6">Why food vans love Eventifood</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {whyUs.slice(0, 4).map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xl">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything you need to run your van
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              One platform — from taking orders at the hatch to closing your books at the end of the day.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-100 p-7 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl mb-5 group-hover:bg-brand-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart domain routing callout */}
      <section className="py-16 bg-gradient-to-r from-brand-50 to-purple-50 border-y border-brand-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Smart Domain Routing</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
              Your store at <span className="text-brand-600">yourname.eventifood.com</span>
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              The moment you register, you get a unique branded URL. Share it on social media, print it on packaging, or embed it in a QR code — every customer lands directly on <em>your</em> menu, not a generic directory.
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                'Instant subdomain — live the second you register',
                'Full-screen mobile menu with your branding',
                'Custom colours and logo throughout',
                'Shareable link for Instagram, Facebook & TikTok bios',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gold-400 flex items-center justify-center text-white text-xs font-bold">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 max-w-sm mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-brand-100 overflow-hidden">
              <div className="bg-brand-600 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-yellow-400" /><span className="w-3 h-3 rounded-full bg-green-400" /></div>
                <span className="text-white/80 text-xs font-mono flex-1 text-center">🔒 thesizzleshack.eventifood.com</span>
              </div>
              <div className="p-5">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-brand-50 border-4 border-brand-200 mx-auto mb-2 flex items-center justify-center text-2xl">🔥</div>
                  <p className="font-bold text-gray-900">The Sizzle Shack</p>
                  <p className="text-xs text-gray-400">Burgers · Loaded Fries · Shakes</p>
                </div>
                {[
                  { name: 'Classic Smash Burger', price: '£9.50' },
                  { name: 'Loaded Cheese Fries', price: '£5.00' },
                  { name: 'Strawberry Shake', price: '£4.50' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-600">{item.price}</span>
                      <button className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center hover:bg-brand-700">+</button>
                    </div>
                  </div>
                ))}
                <button className="mt-4 w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                  View basket (0)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — buyer */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Dead simple for your customers</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">No training needed. No app to download. Just scan and order.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {buyerSteps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-200">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          {/* Queue / people waiting illustration */}
          <div className="mt-12 overflow-hidden rounded-2xl bg-brand-50 border border-brand-100 px-4 pb-0 pt-4">
            <p className="text-center text-xs font-semibold text-brand-400 uppercase tracking-widest mb-2">Your customers, their phone, your van</p>
            <QueueSilhouetteSVG className="w-full text-brand-600 max-h-36" />
          </div>
        </div>
      </section>

      {/* Order management / kitchen board callout */}
      <section className="py-16 bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-12">
          {/* Mock kitchen board */}
          <div className="flex-1 max-w-md">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
              <div className="bg-brand-700 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-white text-sm">Kitchen Board — Live Orders</span>
                <span className="text-xs text-brand-200 animate-pulse">● 3 active</span>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { id: '#1042', items: ['Smash Burger ×2', 'Loaded Fries ×1'], status: 'Preparing', color: 'bg-gold-500' },
                  { id: '#1043', items: ['Chicken Wrap ×1', 'Shake ×2'], status: 'New', color: 'bg-green-500' },
                  { id: '#1044', items: ['Veggie Burger ×1'], status: 'Ready', color: 'bg-brand-500' },
                ].map((order) => (
                  <div key={order.id} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-1">{order.id}</p>
                      {order.items.map((i) => <p key={i} className="text-sm text-white">{i}</p>)}
                    </div>
                    <span className={`${order.color} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>{order.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <span className="inline-block bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Live Kitchen Board</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Never miss an order at peak service</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Every order pings straight to your kitchen display the moment a customer pays. Tap once to mark it preparing. Tap again to mark it ready — the customer sees it update live on their phone.
            </p>
            <ul className="space-y-3 text-sm text-gray-300">
              {[
                'Real-time order stream — no refreshing needed',
                'One-tap status updates: New → Preparing → Ready',
                'Customers notified the instant their order is ready',
                'Works on any tablet, phone or laptop screen',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="text-gold-400 font-bold mt-0.5">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-brand-50 relative overflow-hidden">
        {/* Festival stage background illustration */}
        <FestivalStageSVG className="absolute bottom-0 left-0 right-0 w-full text-brand-400 pointer-events-none opacity-60" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-12">What sellers are saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-gold-400 text-sm">★</span>)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-brand-500 text-xs">{t.van}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Crowd silhouette at bottom of testimonials */}
        <CrowdSilhouetteSVG className="w-full text-brand-500 mt-8 pointer-events-none" />
      </section>

      {/* Why us — full grid */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-12">8 reasons food vans choose Eventifood</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyUs.map((item) => (
              <div key={item.text} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <span className="text-sm text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Simple, honest pricing</h2>
            <p className="text-lg text-gray-500">Start free. Scale when you need to. No hidden fees.</p>
          </div>
          <PricingSection />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-brand-700 text-white text-center relative overflow-hidden">
        {/* Bunting decoration */}
        <BuntingSVG className="absolute top-0 left-0 right-0 w-full text-gold-400 pointer-events-none" />
        {/* Van decal bottom-left */}
        <FoodTruckSVG className="absolute -bottom-4 -left-8 w-64 text-white opacity-10 pointer-events-none hidden md:block" />
        {/* Music notes top-right */}
        <MusicNotesSVG className="absolute top-8 right-8 w-36 text-white pointer-events-none hidden md:block" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative">
          <Image src="/logo.png" alt="Eventifood" width={320} height={112} className="h-28 w-auto mx-auto mb-8 brightness-0 invert" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to open your store?</h2>
          <p className="text-brand-200 text-lg mb-10">
            Join food van owners already using Eventifood. Set up is free, takes 30 minutes, and your QR-code store is live today.
          </p>
          <Link href="/register" className="inline-block bg-gold-400 hover:bg-gold-500 text-white font-bold text-lg py-4 px-12 rounded-xl shadow-xl hover:shadow-2xl transition-all">
            Open your store free →
          </Link>
          <p className="mt-5 text-sm text-brand-300">No credit card. No setup fee. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image src="/logo.png" alt="Eventifood" width={240} height={80} className="h-18 w-auto brightness-0 invert opacity-70" />
            <div className="flex gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-xs text-center text-gray-600">
            © {new Date().getFullYear()} Eventifood. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  )
}
