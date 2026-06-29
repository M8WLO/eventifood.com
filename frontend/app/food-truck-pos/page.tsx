import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Food Truck POS System — No Monthly Fee | Eventifood',
  description:
    'The food truck POS built for the hatch, not the till. QR ordering shifts order-taking to the customer\'s phone. Live kitchen display. Cashless payments. No card terminal to rent. 2% per transaction only.',
  keywords: [
    'food truck POS',
    'food truck point of sale',
    'food truck EPOS UK',
    'food truck POS system',
    'street food POS',
    'mobile catering POS',
    'food van POS',
    'food truck till system',
    'food truck card payment',
  ],
  alternates: { canonical: 'https://eventifood.com/food-truck-pos' },
  openGraph: {
    title: 'Food Truck POS System — No Monthly Fee | Eventifood',
    description:
      'QR ordering shifts order-taking to the customer\'s phone. Live kitchen display. Cashless payments. No card terminal. No monthly fee.',
    url: 'https://eventifood.com/food-truck-pos',
  },
}

const vs = [
  { label: 'Staff take orders at the hatch', traditional: true, eventifood: false },
  { label: 'Customers order on their own phone', traditional: false, eventifood: true },
  { label: 'Card terminal to rent or buy', traditional: true, eventifood: false },
  { label: 'Monthly software subscription', traditional: true, eventifood: false },
  { label: 'Cash handling at the window', traditional: true, eventifood: false },
  { label: 'Live kitchen display board', traditional: false, eventifood: true },
  { label: 'Customer notified when order is ready', traditional: false, eventifood: true },
  { label: 'Sales analytics and profit tracking', traditional: false, eventifood: true },
  { label: 'Works on any phone or tablet', traditional: true, eventifood: true },
  { label: 'Pay nothing when not trading', traditional: false, eventifood: true },
]

export default function FoodTruckPOSPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-purple-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Eventifood" width={200} height={64} className="h-12 w-auto" priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors hidden sm:block">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block bg-gold-400/20 border border-gold-400/40 text-gold-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">Food Truck POS</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            A food truck POS that<br />
            <span className="text-gold-400">works like your van does</span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-10">
            Traditional POS systems were built for restaurants with fixed tills and patient customers. Eventifood is built for the reality of a food truck — mobile, fast, cashless, and working flat out at 500 customers a day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-gold-500 hover:bg-gold-600 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-lg transition-all">
              Start free — no card required →
            </Link>
            <Link href="/" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-lg py-4 px-8 rounded-xl transition-all">
              See all features
            </Link>
          </div>
          <p className="mt-5 text-sm text-purple-300">2% per transaction. No monthly fee. No terminal to rent.</p>
        </div>
      </section>

      {/* How it differs */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Eventifood vs a traditional food truck POS</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A standard EPOS system just moves the till onto a tablet. Eventifood removes the till entirely.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
              <div className="px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wide">Feature</div>
              <div className="px-6 py-4 text-sm font-semibold text-gray-700 text-center uppercase tracking-wide">Traditional POS</div>
              <div className="px-6 py-4 text-sm font-bold text-brand-600 text-center uppercase tracking-wide">Eventifood</div>
            </div>
            {vs.map(({ label, traditional, eventifood }) => (
              <div key={label} className="grid grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="px-6 py-4 text-sm text-gray-700">{label}</div>
                <div className="px-6 py-4 text-center">{traditional ? <span className="text-red-400 font-bold text-lg">✗</span> : <span className="text-green-500 font-bold text-lg">✓</span>}</div>
                <div className="px-6 py-4 text-center">{eventifood ? <span className="text-green-500 font-bold text-lg">✓</span> : <span className="text-red-400 font-bold text-lg">✗</span>}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-14">How Eventifood replaces your food truck POS</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: '📱', title: 'Customer scans your QR code', desc: 'No app download. Your full menu opens in their phone browser the moment they scan. They browse, customise and pay — all before they reach the front.' },
              { icon: '🖥️', title: 'Kitchen display shows every order', desc: 'Paid orders appear on your kitchen screen instantly. One tap marks it preparing. Another marks it ready. The customer gets a notification — staff never call a name.' },
              { icon: '💳', title: 'Card & PayPal payments', desc: 'Payments happen on the customer\'s phone. No card terminal to rent. Apple Pay & Google Pay coming soon via Stripe. Every transaction is digital and instantly reconciled.' },
              { icon: '📊', title: 'Analytics at end of service', desc: 'See exactly what sold, when your peak was, and what your profit margin looked like. More insight than any traditional till system — with less admin.' },
            ].map((step) => (
              <div key={step.title} className="bg-white rounded-2xl p-7 border border-gray-200 shadow-sm">
                <div className="text-3xl mb-4">{step.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing callout */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">No terminal. No subscription. No monthly fee.</h2>
          <p className="text-lg text-gray-500 mb-10">
            Traditional food truck POS and EPOS systems charge £30–£100/month plus terminal rental regardless of whether you trade. Eventifood charges 2% per transaction — and nothing when you are not.
          </p>
          <div className="bg-brand-700 rounded-2xl p-8 text-white mb-10">
            <p className="text-5xl font-extrabold text-gold-400 mb-2">2%</p>
            <p className="text-xl font-semibold mb-1">per transaction</p>
            <p className="text-brand-300 text-sm">+ Stripe card processing (1.5% + 20p, UK cards) — the same fee you pay with any card machine</p>
          </div>
          <Link href="/register" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg py-4 px-12 rounded-xl shadow-lg transition-all">
            Set up your free food truck store →
          </Link>
          <p className="mt-4 text-sm text-gray-400">Up and running in 30 minutes. No developer needed.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-10 text-center text-sm">
        <Link href="/" className="text-brand-400 hover:text-brand-300 font-semibold">← Back to Eventifood</Link>
        <p className="mt-4">© {new Date().getFullYear()} Eventifood. Food truck software built for UK traders.</p>
      </footer>

    </div>
  )
}
