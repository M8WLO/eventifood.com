import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PricingSection, { type Plan } from './(platform)/pricing-section'

export const metadata: Metadata = {
  title: 'Throw Away Your Card Machine — The Ultimate Food Van Solution | Eventifood',
  description:
    "The UK's food van platform. Runs on tablet, Raspberry Pi or any PC — no dedicated till or POS hardware needed. Works with SumUp, PayPal and Stripe. Go fully cashless, serve queues 6× faster. From £19/month.",
  alternates: { canonical: 'https://eventifood.com' },
  openGraph: {
    title: 'Throw Away Your Card Machine — The Ultimate Food Van Solution | Eventifood',
    description:
      "No till. No card machine. No POS hardware. Runs on any tablet, Raspberry Pi or PC. Works with SumUp, PayPal and Stripe. The ultimate food van solution — from £19/month.",
    url: 'https://eventifood.com',
  },
}

const FALLBACK_PLANS: Plan[] = [
  {
    id: 0, name: 'Starter', slug: 'starter', billing_model: 'payg', monthly_price: '0',
    platform_fee_percent: '2.00', description: 'Core ordering — free to use',
    features: [], feature_flags: [], is_highlighted: false, display_order: 0,
  },
  {
    id: 1, name: 'Trader', slug: 'trader', billing_model: 'subscription', monthly_price: '19',
    platform_fee_percent: '0.00', description: 'Everything you need to trade',
    features: [], feature_flags: ['inventory', 'wastage', 'print_menus', 'wait_time'],
    is_highlighted: true, display_order: 1,
  },
  {
    id: 2, name: 'Pro', slug: 'pro', billing_model: 'subscription', monthly_price: '39',
    platform_fee_percent: '0.00', description: 'Full platform for serious sellers',
    features: [], feature_flags: ['inventory', 'wastage', 'print_menus', 'wait_time', 'events', 'analytics', 'staff'],
    is_highlighted: false, display_order: 2,
  },
]

interface ActivePromotion {
  banner_headline: string
  banner_subtext: string
  banner_cta: string
}

async function fetchPlans(): Promise<Plan[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(`${apiUrl}/api/subscriptions/plans/`, { next: { revalidate: 300 } })
    if (!res.ok) return FALLBACK_PLANS
    const data = await res.json()
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_PLANS
  } catch {
    return FALLBACK_PLANS
  }
}

async function fetchActivePromotion(): Promise<ActivePromotion | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(`${apiUrl}/api/tenants/promotions/active/`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = await res.json()
    return data && data.banner_headline ? data : null
  } catch {
    return null
  }
}

/* ── Decorative SVG components ── */

function FoodTruckSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 200" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="65" width="260" height="95" rx="10" fill="currentColor" opacity="0.85" />
      <rect x="240" y="44" width="80" height="116" rx="10" fill="currentColor" opacity="1" />
      <rect x="250" y="55" width="58" height="50" rx="5" fill="white" opacity="0.25" />
      <path d="M18 68 L155 68 L142 50 L30 50 Z" fill="#F5A623" />
      <line x1="55" y1="50" x2="50" y2="68" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="82" y1="50" x2="77" y2="68" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="109" y1="50" x2="104" y2="68" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="135" y1="50" x2="130" y2="68" stroke="white" strokeWidth="2" opacity="0.5" />
      <rect x="25" y="72" width="108" height="60" rx="4" fill="white" opacity="0.18" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      <rect x="25" y="125" width="108" height="7" rx="2" fill="white" opacity="0.15" />
      <ellipse cx="60" cy="118" rx="10" ry="7" fill="#F5A623" opacity="0.6" />
      <ellipse cx="90" cy="115" rx="12" ry="8" fill="#F5A623" opacity="0.5" />
      <circle cx="75" cy="158" r="28" fill="#1f2937" />
      <circle cx="75" cy="158" r="16" fill="#374151" />
      <circle cx="75" cy="158" r="7" fill="#6b7280" />
      <circle cx="255" cy="158" r="28" fill="#1f2937" />
      <circle cx="255" cy="158" r="16" fill="#374151" />
      <circle cx="255" cy="158" r="7" fill="#6b7280" />
      <rect x="50" y="152" width="270" height="6" rx="3" fill="#374151" />
      <rect x="180" y="40" width="8" height="28" rx="3" fill="#374151" />
      <circle cx="184" cy="34" r="7" fill="white" opacity="0.35" />
      <circle cx="178" cy="24" r="6" fill="white" opacity="0.25" />
      <rect x="30" y="38" width="100" height="18" rx="4" fill="#F5A623" opacity="0.9" />
    </svg>
  )
}

function BuntingSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 60" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 10 Q50 30 100 10 Q150 30 200 10 Q250 30 300 10 Q350 30 400 10 Q450 30 500 10 Q550 30 600 10 Q650 30 700 10 Q750 30 800 10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
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

/* ── Phone mockup wrapper ── */
function PhoneMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto" style={{ width: 240, height: 480 }}>
      {/* Phone shell */}
      <div className="absolute inset-0 rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl z-10" />
        <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
          <Image src={src} alt={alt} fill style={{ objectFit: 'cover', objectPosition: 'top' }} />
        </div>
      </div>
    </div>
  )
}

/* ── Browser mockup wrapper ── */
function BrowserMockup({ src, alt, url }: { src: string; alt: string; url?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-white">
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="flex-1 bg-white text-gray-400 text-xs font-mono px-3 py-1 rounded-md border border-gray-200 text-center truncate">
          🔒 {url || 'eventifood.com'}
        </span>
      </div>
      <div className="relative" style={{ aspectRatio: '16/10', minHeight: 240 }}>
        <Image src={src} alt={alt} fill style={{ objectFit: 'cover', objectPosition: 'top' }} />
      </div>
    </div>
  )
}

const sellerFeatures = [
  { icon: '🍽️', title: 'Dynamic Menus', desc: 'Build your full menu with categories, items, photos, extras and modifiers. Change prices, add specials, and hide sold-out items — all from your phone.' },
  { icon: '🎪', title: 'Event Menus', desc: 'Running at a festival this weekend? Create a one-off event menu with its own prices, items and branding — completely separate from your regular menu.' },
  { icon: '🖨️', title: 'Printable Menus with QR Codes', desc: 'Generate A4/A3/A2 print-ready menus with individual QR codes on every item. Customers scan the item they want and it goes straight into their basket.' },
  { icon: '📦', title: 'Inventory Control', desc: 'Set stock levels per item. Sold-out items disappear from the customer menu automatically. No more apologising at the hatch.' },
  { icon: '📊', title: 'Sales Analytics', desc: "See exactly what's selling, when your busiest periods are, and where your profit is coming from — then make smarter decisions about your menu and stock." },
  { icon: '💳', title: 'Multi-Provider Payments', desc: 'Accept card payments and PayPal today. Apple Pay and Google Pay arrive with Stripe Connect — coming soon. You choose which providers suit your business.' },
]

const customerBenefits = [
  { icon: '📱', title: 'No App. Just Scan.', desc: 'Customers scan a QR code and your full menu opens instantly in their browser. No download, no account, no friction.' },
  { icon: '🔔', title: 'Live Order Status', desc: 'From "Being Prepared" to "Ready for Collection" — customers see their order status update in real time. No shouting names across the crowd.' },
  { icon: '💸', title: '100% Cashless', desc: 'Secure card and mobile payments processed at the point of ordering. No cash handling, no floats, no counting takings at the end of the night.' },
  { icon: '🛒', title: 'Extras & Customisation', desc: 'Extra cheese? No onions? Customers add modifiers right in the app — no back-and-forth with staff, and the kitchen sees exactly what was requested.' },
]

const throughputPoints = [
  { stat: '6×', label: 'Less time spent at the hatch per customer', sub: 'Orders placed on the phone before customers even reach the front' },
  { stat: '40%', label: 'More orders served per hour', sub: 'Staff spend time cooking, not taking orders and handling cash' },
  { stat: '0', label: 'Cash transactions to reconcile', sub: 'Every penny tracked digitally — end of day close-out in seconds' },
  { stat: '30 min', label: 'From sign-up to first live order', sub: 'Upload your menu, get your QR code, start trading today' },
]

const whyUs = [
  { icon: '⚡', title: 'Live in 30 minutes', desc: 'Register, upload your menu and your QR-code store is ready to trade. No developer needed.' },
  { icon: '📵', title: 'No app for customers', desc: 'Customers order through their phone browser — nothing to download, nothing standing between them and your food.' },
  { icon: '💳', title: 'Fully cashless', desc: 'Card and PayPal live now. Apple Pay and Google Pay coming soon via Stripe. No cash float, no end-of-night counting.' },
  { icon: '🔔', title: 'Real-time customer alerts', desc: 'Customers get a live notification the moment their order is ready. Stop shouting names over the noise of the crowd.' },
  { icon: '🎨', title: 'Branded to your van', desc: 'Upload your logo, choose your theme colour, and your store looks like you — not a generic checkout page.' },
  { icon: '🎪', title: 'Festival & event ready', desc: 'Create a bespoke event menu for any occasion with custom items, pricing and branding — ready in minutes.' },
  { icon: '📈', title: 'Know your numbers', desc: 'Top sellers, hourly revenue, profit per item — all the data you need to run a tighter, more profitable van.' },
  { icon: '❄️', title: 'Choose PAYG or monthly', desc: 'Seasonal trader? PAYG means zero cost when you\'re not trading. Trade year-round? A flat monthly plan can lower your cost per order. You decide — and you can switch any time.' },
  { icon: '🔒', title: 'Secure by default', desc: 'Every seller account is protected with email MFA. Your dashboard, your data, your business.' },
  { icon: '🖨️', title: 'Printed QR menus', desc: 'Generate print-ready menus with QR codes on every single item. Stick them on your van, hand them out at the gate, or pin them to tables.' },
  { icon: '📦', title: 'Automatic stock control', desc: 'Running low? Sold out? Items hide themselves from the customer menu automatically so you never disappoint.' },
  { icon: '🌐', title: 'Your own branded URL', desc: 'yourname.eventifood.com — share it everywhere. Every customer who clicks lands on your menu, not a marketplace.' },
]

const testimonials = [
  {
    quote: "We used to serve 40 customers an hour on a good day. Now we're hitting 60+ because people order ahead while queuing. The kitchen board means nothing gets missed.",
    name: 'Sarah M.', van: 'The Sizzle Shack',
  },
  {
    quote: "Setting up took 20 minutes. The live order alerts are brilliant — customers stop hovering at the hatch because they know their phone will buzz when it's ready.",
    name: 'Tom K.', van: 'Kogi Street',
  },
  {
    quote: "I ran a festival event menu for the weekend — totally different prices and items from my regular menu, live within 10 minutes. Absolutely game-changing.",
    name: 'Priya R.', van: 'Spice Route',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Eventifood and how does it work for food vans?',
      acceptedAnswer: { '@type': 'Answer', text: 'Eventifood is a food van software and ordering platform built specifically for UK food trucks, street food traders, mobile caterers and festival vendors. Customers scan a QR code, browse your menu, pay on their phone, and get notified when their food is ready — all without downloading an app.' },
    },
    {
      '@type': 'Question',
      name: 'Does Eventifood have a monthly fee?',
      acceptedAnswer: { '@type': 'Answer', text: 'You choose. The PAYG plan has no monthly fee — you pay 2% per transaction only when orders come through, making it ideal for seasonal food trucks and festival traders who park up in winter and pay nothing in the off-season. If your van trades heavily year-round, a flat monthly plan can lower your overall cost per order. Both plans include the full platform with no feature restrictions.' },
    },
    {
      '@type': 'Question',
      name: 'Do my customers need to download an app?',
      acceptedAnswer: { '@type': 'Answer', text: 'No app required. Customers scan a QR code and your full menu opens in their mobile browser. No download, no account, no friction.' },
    },
    {
      '@type': 'Question',
      name: 'How does Eventifood help with food truck queue management?',
      acceptedAnswer: { '@type': 'Answer', text: 'Customers browse and pay on their phone while waiting. The kitchen receives the order instantly, and customers get a notification when food is ready. Van owners report serving 40–60% more customers per hour at events.' },
    },
    {
      '@type': 'Question',
      name: 'How is Eventifood different from a standard food truck POS?',
      acceptedAnswer: { '@type': 'Answer', text: 'Eventifood shifts order-taking entirely to the customer\'s phone. Staff focus on cooking. There is no card machine to rent, no monthly software fee, and no terminal at the hatch.' },
    },
    {
      '@type': 'Question',
      name: 'What hardware do I need to run Eventifood?',
      acceptedAnswer: { '@type': 'Answer', text: 'None that you do not already own. Eventifood runs in a browser on any Windows PC, Mac, tablet (iPad, Android, Amazon Fire) or Raspberry Pi. No dedicated till, no POS machine, and no card reader required. For card payments, Eventifood works with SumUp, PayPal and Stripe — use whichever you already have.' },
    },
  ],
}

export default async function LandingPage() {
  const [plans, promo] = await Promise.all([fetchPlans(), fetchActivePromotion()])

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Promotion Banner (dynamic from admin) ── */}
      {promo && (
        <div className="relative bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-900 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
            <div className="absolute top-0 left-8 w-2 h-6 bg-white/30 rotate-12 rounded-full" />
            <div className="absolute top-1 left-24 w-1.5 h-4 bg-brand-700/25 -rotate-6 rounded-full" />
            <div className="absolute bottom-0 left-40 w-2 h-5 bg-white/20 rotate-45 rounded-full" />
            <div className="absolute top-0 right-32 w-2 h-6 bg-brand-700/20 -rotate-12 rounded-full" />
            <div className="absolute bottom-1 right-16 w-1.5 h-4 bg-white/30 rotate-6 rounded-full" />
            <div className="absolute top-1 right-56 w-2 h-5 bg-white/20 rotate-30 rounded-full" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="text-xl" aria-hidden="true">🎉</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-extrabold text-sm sm:text-base tracking-tight">
                {promo.banner_headline}
              </span>
              <span className="text-xs sm:text-sm text-amber-900 font-medium">
                {promo.banner_subtext}
              </span>
            </div>
            <Link
              href="/register"
              className="shrink-0 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {promo.banner_cta}
            </Link>
          </div>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-purple-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Eventifood" width={280} height={96} className="h-20 w-auto" priority />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#for-sellers" className="hover:text-brand-600 transition-colors">For Sellers</a>
            <a href="#for-customers" className="hover:text-brand-600 transition-colors">For Customers</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors hidden sm:block">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold-400 blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-gold-500 blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <FoodTruckSVG className="absolute right-0 bottom-12 w-80 xl:w-96 text-white opacity-15 pointer-events-none hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-gold-500/20 text-gold-300 text-xs sm:text-sm font-bold px-5 py-2 rounded-full uppercase tracking-widest mb-6 border border-gold-400/30">
              The ultimate food van solution
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-4">
              Throw away<br />
              <span className="text-gold-400">your card machine.</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-6">
              Runs on any tablet, Raspberry Pi or PC — no dedicated till, no POS hardware, no card reader required. Go fully cashless. Serve queues 6× faster. Watch your turnover grow.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-10 text-sm font-medium">
              <span className="bg-white/10 text-purple-200 px-3 py-1.5 rounded-full border border-white/20">✓ SumUp</span>
              <span className="bg-white/10 text-purple-200 px-3 py-1.5 rounded-full border border-white/20">✓ PayPal</span>
              <span className="bg-white/10 text-purple-200 px-3 py-1.5 rounded-full border border-white/20">✓ Stripe</span>
              <span className="bg-white/10 text-purple-200 px-3 py-1.5 rounded-full border border-white/20">✓ Tablet · Pi · PC</span>
              <span className="bg-white/10 text-purple-200 px-3 py-1.5 rounded-full border border-white/20">✓ No hardware needed</span>
            </div>
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

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 240 60 0 20L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── No hardware / any device strip ── */}
      <section className="py-10 bg-gray-950 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest mb-8">No specialist hardware required — run it on what you already own</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">💻</div>
              <p className="font-bold text-white text-sm">Windows / Mac / Linux</p>
              <p className="text-gray-500 text-xs mt-1">Any laptop or desktop. Opens in a browser — nothing to install.</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📱</div>
              <p className="font-bold text-white text-sm">Tablet</p>
              <p className="text-gray-500 text-xs mt-1">iPad, Android or Amazon Fire. Mount it in your van and go.</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🍓</div>
              <p className="font-bold text-white text-sm">Raspberry Pi</p>
              <p className="text-gray-500 text-xs mt-1">Full POS on a £35 board. No dedicated till or POS machine needed.</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💳</div>
              <p className="font-bold text-white text-sm">SumUp · PayPal · Stripe</p>
              <p className="text-gray-500 text-xs mt-1">Use the provider you already have. Switch or add another anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact stats ── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {throughputPoints.map((p) => (
              <div key={p.stat} className="text-center">
                <p className="text-4xl sm:text-5xl font-extrabold text-brand-600 mb-1">{p.stat}</p>
                <p className="text-sm font-semibold text-gray-800 mb-1">{p.label}</p>
                <p className="text-xs text-gray-400 leading-snug">{p.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOR SELLERS ══ */}
      <section id="for-sellers" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">For Van Owners</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything you need to run your van better
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              One platform from taking the first order at the hatch to closing your books at the end of the night.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellerFeatures.map((f) => (
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

      {/* ── Kitchen Board feature callout ── */}
      <section className="py-16 bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="inline-block bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Live Kitchen Board</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Never miss a single order, even at peak service</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Every paid order appears on your kitchen screen instantly. No phone calls, no paper slips, no shouted orders that get lost in the noise. One tap marks it preparing. Another tap marks it ready — and the customer's phone lights up the moment you do.
            </p>
            <ul className="space-y-3 text-sm text-gray-300">
              {[
                'Instant order stream — every order paid online appears in seconds',
                'One-tap flow: New → Preparing → Ready → Collected',
                'Customer notified the instant their order is ready — no name-calling',
                'Works on any screen — tablet propped up, laptop, second monitor',
                'Undo button if you tap by mistake',
                'History view for the full shift record',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="text-gold-400 font-bold mt-0.5 shrink-0">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 max-w-lg w-full">
            <BrowserMockup src="/Kitchen View.png" alt="Food truck kitchen display board showing live orders in real time" url="eventifood.com/seller/orders/board" />
          </div>
        </div>
      </section>

      {/* ── Queue reduction / throughput ── */}
      <section className="py-20 bg-gradient-to-br from-gold-50 to-orange-50 border-y border-gold-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block bg-gold-400 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Throughput & Revenue</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Sell more food in the same number of hours
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              When customers order on their phone before they reach the front, your hatch becomes a collection point — not a bottleneck. Your staff stop taking orders and start focusing entirely on cooking.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h3 className="font-extrabold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">😰</span> Without Eventifood
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  'Customer joins queue, waits, reaches hatch',
                  'Staff take verbal order — clarify extras, misheard items',
                  'Cash handled, change given, hands contaminated',
                  'Customer hangs around the hatch waiting',
                  'Another customer shouts they want to add something',
                  'Staff call the name — nobody hears over the crowd',
                  'Repeat for every single customer',
                ].map((t) => (<li key={t} className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span>{t}</li>))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-brand-200 p-8 shadow-sm">
              <h3 className="font-extrabold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <span className="text-2xl">🚀</span> With Eventifood
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  'Customer scans QR, browses the full menu on their phone',
                  'Places order with customisations — perfectly captured',
                  'Pays in seconds — card or PayPal',
                  'Kitchen board lights up instantly — staff start cooking',
                  'Customer steps aside and waits comfortably',
                  'Phone buzzes: "Ready for collection" — they walk up and go',
                  'Queue clears 6× faster. Staff never stop cooking.',
                ].map((t) => (<li key={t} className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>{t}</li>))}
              </ul>
            </div>
          </div>
          <div className="bg-brand-700 rounded-2xl p-8 text-white text-center shadow-xl">
            <p className="text-4xl font-extrabold mb-2 text-gold-400">600% faster queue throughput</p>
            <p className="text-brand-200 text-lg">Van owners using Eventifood report serving up to 6× more customers per hour at peak events — with less stress on staff and fewer mistakes on every order.</p>
          </div>
        </div>
      </section>

      {/* ── Edit product / menu management ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="flex-1">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Menu Management</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">Your full menu — built in minutes, changed in seconds</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Add categories, items, photos, pricing, variations (sizes, meal deals) and extras (add cheese, remove onion). Update prices on the fly, hide items that have sold out, and your live store updates immediately.
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                'Unlimited categories and items',
                'Single price or size/variation pricing (Small / Regular / Large)',
                'Extras and removals with + / − pricing',
                'Item photos uploaded from your phone',
                'Cost price tracking for profit visibility per item',
                'Changes go live on your store the moment you save',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="text-brand-500 font-bold mt-0.5 shrink-0">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 max-w-xs mx-auto">
            <PhoneMockup src="/Edit Product Details.png" alt="Food van menu management — edit product details on mobile" />
          </div>
        </div>
      </section>

      {/* ── Print menus callout ── */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Print Menus</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">Printed menus — with a QR code on every single item</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Generate a professional A4, A3 or A2 print-ready menu with your store's branding. Every item has its own individual QR code — customers scan the item they want and it drops straight into their basket. No searching through the menu, no typing — just scan and go.
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                'A4 / A3 / A2 sizes — pin to your van, hand out at the gate, or use as table cards',
                'A QR code on every item — tap to add directly to basket',
                'Store QR code in the header for scanning the full menu',
                'Download as PDF or print directly from the browser',
                'Always up to date — regenerate any time you change your menu',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="text-brand-500 font-bold mt-0.5 shrink-0">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 max-w-lg w-full">
            <BrowserMockup src="/print menu.png" alt="Printable food truck menu with QR codes on every item" url="eventifood.com/print-menu/1" />
          </div>
        </div>
      </section>

      {/* ── Analytics callout ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="flex-1">
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Analytics</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">Know exactly what's working — and what isn't</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              See your top-selling items, busiest trading hours, daily revenue and profit per item. Stop guessing which products to push and which to cut — let your actual data tell you.
            </p>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                'Top-selling items by quantity and revenue',
                'Revenue by day, week and trading period',
                'Gross and net profit per item (requires cost prices)',
                'Busiest and quietest trading hours at a glance',
                'Identify what to promote, reprice or remove',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="text-brand-500 font-bold mt-0.5 shrink-0">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 max-w-lg w-full">
            <BrowserMockup src="/Analytics.png" alt="Food truck sales analytics dashboard — revenue, top sellers and profit tracking" url="eventifood.com/seller/analytics" />
          </div>
        </div>
      </section>

      {/* ══ FOR CUSTOMERS ══ */}
      <section id="for-customers" className="py-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-gold-400 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">For Your Customers</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              The ordering experience your customers will love
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              No app. No account. No friction. Just scan, order, pay, and wait comfortably — knowing their phone will tell them the moment their food is ready.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {customerBenefits.map((f) => (
              <div key={f.title} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Customer journey — phone screenshots */}
          <div className="text-center mb-10">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">From scan to collection — the full customer journey</h3>
            <p className="text-gray-500 text-sm">Real screenshots from the Eventifood customer experience</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-end">
            <div className="text-center space-y-3">
              <PhoneMockup src="/Customer Order Screen.png" alt="Customer ordering from food truck using QR code — no app needed" />
              <div className="bg-brand-600 text-white rounded-xl px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5">Step 1</p>
                <p className="text-sm font-semibold">Browse & add to basket</p>
                <p className="text-xs text-brand-200 mt-1">Full menu on their phone — photos, extras, prices</p>
              </div>
            </div>
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center h-[480px] rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
                <div className="text-center px-6">
                  <div className="text-5xl mb-4">💳</div>
                  <p className="text-white font-bold text-sm">Pay securely</p>
                  <p className="text-gray-400 text-xs mt-2">Card · PayPal</p>
                  <p className="text-gray-500 text-xs mt-1">Apple Pay &amp; Google Pay — coming soon</p>
                  <p className="text-xs text-gray-500 mt-3">Processed in seconds.<br />No cash. No change.</p>
                </div>
              </div>
              <div className="bg-gold-500 text-white rounded-xl px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5">Step 2</p>
                <p className="text-sm font-semibold">Pay on their phone</p>
                <p className="text-xs text-yellow-100 mt-1">Card or PayPal · Apple Pay &amp; Google Pay coming soon</p>
              </div>
            </div>
            <div className="text-center space-y-3">
              <PhoneMockup src="/Being Prepared.png" alt="Food truck order being prepared — live status on customer phone" />
              <div className="bg-orange-500 text-white rounded-xl px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5">Step 3</p>
                <p className="text-sm font-semibold">Watch it live</p>
                <p className="text-xs text-orange-100 mt-1">Real-time status on their screen — no more hovering at the hatch</p>
              </div>
            </div>
            <div className="text-center space-y-3">
              <PhoneMockup src="/ready for collection.png" alt="Food truck order ready for collection — customer notified instantly" />
              <div className="bg-green-600 text-white rounded-xl px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5">Step 4</p>
                <p className="text-sm font-semibold">Phone buzzes: Ready!</p>
                <p className="text-xs text-green-100 mt-1">Customer comes to collect — staff never shout a name again</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cash-free section ── */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-5xl mb-6">💳</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Go completely cashless</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            Every transaction is digital. No float to manage before the event. No cash to count at the end. No contaminated hands during food prep. No shortfall at the bank on Monday morning. Just a clean, accurate digital record of every single sale.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '🧼', title: 'Hygienic', desc: 'Staff never handle cash during food prep — reducing contamination risk and satisfying food hygiene requirements.' },
              { icon: '🔐', title: 'Secure', desc: 'No risk of theft at the hatch. Every payment is digital, traceable and instantly reconciled against your orders.' },
              { icon: '⚡', title: 'Fast', desc: 'Card and mobile payments are 3× faster than cash. Shorter time at the hatch means a shorter queue behind every customer.' },
            ].map((c) => (
              <div key={c.title} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-bold text-white mb-2">{c.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Up and running in 30 minutes</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">No developer. No tech skills. Just follow these steps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Create your account', desc: 'Register free. Your branded store at yourname.eventifood.com is created instantly.' },
              { step: '2', title: 'Build your menu', desc: 'Add categories, items, photos, extras and pricing. Your live store updates as you type.' },
              { step: '3', title: 'Display your QR code', desc: 'Print it, pin it to your van, stick it on packaging, or share the link anywhere.' },
              { step: '4', title: 'Start trading', desc: 'Orders arrive on your kitchen board. Customers pay on their phones. You focus on the food.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-200">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-brand-50 border-y border-brand-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
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
      </section>

      {/* ── 12 reasons ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">12 reasons food vans choose Eventifood</h2>
            <p className="text-gray-500">Everything built for the reality of trading at markets, festivals and events.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyUs.map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all">
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Simple, honest pricing</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Start free on PAYG. Upgrade when you need the extra tools. No hidden fees, no monthly bill when you're not trading.</p>
          </div>
          <PricingSection plans={plans} />

          <div className="mt-8 bg-gradient-to-r from-gold-500 to-amber-500 rounded-2xl p-8 text-white text-center shadow-xl">
            <p className="text-3xl sm:text-4xl font-extrabold mb-2">Costs less than 2 hours of staff time a month.</p>
            <p className="text-yellow-100 text-sm sm:text-base max-w-2xl mx-auto mt-3">
              The Trader plan is £19/month — less than paying a member of staff for a Saturday morning shift. Yet it replaces your card machine, your POS terminal, your queue management system, and your end-of-night reconciliation headache. In one platform. On any device you already own.
            </p>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <div className="bg-brand-700 rounded-2xl p-8 text-white text-center">
              <p className="font-extrabold text-xl mb-2">Seasonal trader? PAYG is made for you.</p>
              <p className="text-brand-200 text-sm">On PAYG you only pay when orders come through — 2% per transaction. Park the van in November, come back in April. Your store, your menu, and your full order history are exactly where you left them. You paid nothing while you were away.</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-8 text-white text-center">
              <p className="font-extrabold text-xl mb-2">High-volume van? Monthly can cost less.</p>
              <p className="text-gray-400 text-sm">If you trade heavily year-round, a flat monthly plan replaces the per-transaction fee entirely — meaning the more orders you take, the more you save compared to PAYG. All plans include every feature: no tier restrictions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-brand-700 text-white text-center relative overflow-hidden">
        <BuntingSVG className="absolute top-0 left-0 right-0 w-full text-gold-400 pointer-events-none" />
        <FoodTruckSVG className="absolute -bottom-4 -left-8 w-64 text-white opacity-10 pointer-events-none hidden md:block" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative">
          <Image src="/logo.png" alt="Eventifood" width={320} height={112} className="h-28 w-auto mx-auto mb-8 brightness-0 invert" />
          <p className="text-gold-300 font-bold uppercase tracking-widest text-sm mb-3">The ultimate food van solution</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Throw away your card machine. Start trading smarter today.</h2>
          <p className="text-brand-200 text-lg mb-10">
            Runs on any tablet, Raspberry Pi or PC. Works with SumUp, PayPal and Stripe. Set up is free, takes 30 minutes, and your first order could arrive before the end of the day.
          </p>
          <Link href="/register" className="inline-block bg-gold-400 hover:bg-gold-500 text-white font-bold text-lg py-4 px-12 rounded-xl shadow-xl hover:shadow-2xl transition-all">
            Open your store free →
          </Link>
          <p className="mt-5 text-sm text-brand-300">No credit card. No setup fee. Cancel anytime.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Frequently asked questions</h2>
            <p className="text-gray-500">Everything food van and food truck owners ask us before signing up.</p>
          </div>
          <div className="space-y-6">
            {[
              {
                q: 'What is Eventifood and how does it work for food vans?',
                a: 'Eventifood is a food van software and ordering platform built specifically for UK food trucks, street food traders, mobile caterers and festival vendors. You get a branded ordering page at yourname.eventifood.com, a printable QR code to display at your van, and a live kitchen display board. Customers scan the QR code, browse your menu, pay on their phone, and get notified when their food is ready — all without downloading an app.',
              },
              {
                q: 'Does Eventifood have a monthly fee?',
                a: "You choose the plan that suits your trading pattern. The PAYG plan has no monthly fee at all — you pay 2% per transaction only when orders come through. If your van is parked up for the winter, you pay absolutely nothing, making it ideal for seasonal food trucks, festival traders, and part-year mobile caterers. If you trade heavily year-round, a flat monthly plan can work out cheaper overall by reducing the per-order cost. Both plans include the full Eventifood platform with no feature restrictions.",
              },
              {
                q: 'Do my customers need to download an app?',
                a: "No app required — ever. Your customers scan a QR code with their phone camera and your full menu opens instantly in their mobile browser. There's no download, no account creation, and no friction standing between them and placing an order. This is one of the biggest differences between Eventifood and traditional food truck POS systems.",
              },
              {
                q: 'How does Eventifood help with food truck queue management?',
                a: 'Eventifood eliminates the queue bottleneck entirely. Instead of customers standing at the hatch waiting to order, they browse the menu and pay on their phone while waiting — or even before they arrive. The kitchen receives the order instantly, and customers get a live notification when their food is ready for collection. Van owners consistently report serving 40–60% more customers per hour at events and markets.',
              },
              {
                q: 'Can I use Eventifood at festivals and events?',
                a: "Yes — Eventifood is designed for exactly this. You can create a dedicated event menu with its own pricing, items and branding, completely separate from your regular menu. Switch it live in minutes before an event and switch back afterwards. It works on any mobile data connection and is optimised for high-volume service at busy festivals, markets and corporate catering events.",
              },
              {
                q: 'What payments can my customers use?',
                a: 'Customers can currently pay by card and PayPal — all processed securely at the point of ordering. Apple Pay and Google Pay are coming soon via Stripe Connect. There is no cash handling, no float to manage, and no end-of-night counting. Every payment is recorded digitally and instantly reconciled against your orders.',
              },
              {
                q: 'How is Eventifood different from a standard food truck POS?',
                a: 'A traditional food truck POS (EPOS) requires staff to take orders at the hatch — customers still queue, still wait, and cash or card is handled by the same person making the food. Eventifood shifts order-taking entirely to the customer\'s phone. Staff focus 100% on cooking. The kitchen display shows every order the moment it\'s paid. There is no card machine to rent, no POS terminal, and no monthly fee when you\'re not trading.',
              },
              {
                q: 'What hardware do I need to run Eventifood?',
                a: 'None that you don\'t already own. Eventifood runs in a browser on any Windows PC, Mac, tablet (iPad, Android, Amazon Fire) or Raspberry Pi. Mount a tablet in your van or prop up a cheap laptop and you have a full POS system, kitchen display and customer ordering platform — with no dedicated till, no POS machine, and no card reader required. For card payments, Eventifood works with SumUp, PayPal and Stripe — use whichever you already have.',
              },
              {
                q: 'How long does it take to set up?',
                a: 'Most food van owners are live within 30 minutes. Register, upload your menu, set your prices, and your QR-code ordering store is ready. No developer needed. No tech skills required.',
              },
              {
                q: 'Does it work for mobile catering and street food markets?',
                a: 'Yes. Eventifood is used by food truck operators, street food traders, mobile caterers, market stall vendors, festival food vans, and pop-up kitchens across the UK. The platform is built for mobile, outdoor, and high-footfall trading environments where speed and simplicity matter most.',
              },
              {
                q: 'Can I track my food van sales and profit?',
                a: 'Yes. The analytics dashboard shows your top-selling items, revenue by day or trading period, gross and net profit per item (when you enter cost prices), and your busiest trading hours. You can use this to make smarter decisions about your menu, pricing, and stock ordering.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white rounded-2xl border border-gray-200 px-6 py-5 shadow-sm">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base pr-4">{q}</h3>
                  <span className="text-brand-500 text-xl shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image src="/logo.png" alt="Eventifood" width={240} height={80} className="h-16 w-auto brightness-0 invert opacity-70" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href="#for-sellers" className="hover:text-white transition-colors">For Sellers</a>
              <a href="#for-customers" className="hover:text-white transition-colors">For Customers</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <Link href="/food-truck-pos" className="hover:text-white transition-colors">Food Truck POS</Link>
              <Link href="/qr-code-ordering" className="hover:text-white transition-colors">QR Ordering</Link>
              <Link href="/mobile-catering-software" className="hover:text-white transition-colors">Mobile Catering</Link>
              <Link href="/food-truck-queue-management" className="hover:text-white transition-colors">Queue Management</Link>
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
