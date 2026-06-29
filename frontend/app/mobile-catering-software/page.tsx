import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Mobile Catering Software UK — QR Ordering & Kitchen Board | Eventifood',
  description:
    'Mobile catering software for UK food vans, street food traders, festival caterers and market stalls. QR ordering, live kitchen display, sales analytics and cashless payments. Free to set up.',
  keywords: [
    'mobile catering software',
    'mobile catering software UK',
    'mobile catering app',
    'mobile catering ordering system',
    'street food software UK',
    'mobile catering management software',
    'food van management software',
    'catering van software',
    'festival catering software',
    'market stall ordering app',
  ],
  alternates: { canonical: 'https://eventifood.com/mobile-catering-software' },
  openGraph: {
    title: 'Mobile Catering Software UK — QR Ordering & Kitchen Board | Eventifood',
    description:
      'QR ordering, live kitchen display, sales analytics and cashless payments for UK mobile caterers. Free to set up — 2% per transaction.',
    url: 'https://eventifood.com/mobile-catering-software',
  },
}

const useCases = [
  {
    icon: '🚐',
    title: 'Food vans & trucks',
    desc: 'Street food vans parked at markets, roadsides and lunchtime spots. Your QR code on the side of the van is your ordering system — customers scan from the queue.',
  },
  {
    icon: '🎪',
    title: 'Festival catering',
    desc: 'High-volume service at music festivals, food festivals, county fairs and outdoor events. Handle the rush without hiring more staff — queue management software built in.',
  },
  {
    icon: '🏪',
    title: 'Market stalls',
    desc: 'Indoor and outdoor markets where customers want to browse and pay without waiting. Your stall gets its own QR ordering store — same system, same kitchen board.',
  },
  {
    icon: '🏢',
    title: 'Corporate catering',
    desc: 'Regular lunchtime pitches at offices and business parks. Pre-orders, event menus, and a branded store link your client can share with their staff in advance.',
  },
  {
    icon: '🎉',
    title: 'Private events',
    desc: 'Weddings, parties, sporting events. Create a bespoke event menu with custom items and pricing — separate from your everyday trading menu.',
  },
  {
    icon: '🎡',
    title: 'Pop-up kitchens',
    desc: 'One-off or occasional trading spots — a ghost kitchen weekend, a pop-up collaboration, a charity event. Set up your store once and reuse it every time.',
  },
]

export default function MobileCateringSoftwarePage() {
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
          <span className="inline-block bg-gold-400/20 border border-gold-400/40 text-gold-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">Mobile Catering Software</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Software built for<br />
            <span className="text-gold-400">mobile caterers</span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-10">
            Eventifood is UK mobile catering software built specifically for food vans, street food traders, festival caterers and market stalls. QR ordering, live kitchen board, cashless payments and sales analytics — in one platform, with no monthly fee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-gold-500 hover:bg-gold-600 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-lg transition-all">
              Open your store free →
            </Link>
            <Link href="/" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-lg py-4 px-8 rounded-xl transition-all">
              See all features
            </Link>
          </div>
          <p className="mt-5 text-sm text-purple-300">No credit card. No setup fee. Free to start. 2% per transaction when you trade.</p>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Built for every kind of mobile catering</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Whether you trade daily or just at weekends, at markets or festivals, Eventifood fits around how you work.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((u) => (
              <div key={u.title} className="rounded-2xl border border-gray-100 p-7 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{u.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{u.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key features */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-14">What you get with Eventifood</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: '📱', title: 'QR code ordering', desc: 'Customers scan a code, browse your menu and pay on their phone. No app download, no friction, no queue at the hatch.' },
              { icon: '🖥️', title: 'Live kitchen display board', desc: 'Every paid order appears on your kitchen screen instantly. One tap to mark it preparing, one to mark it ready.' },
              { icon: '🎪', title: 'Event & festival menus', desc: 'Create a custom menu for any event with separate pricing, items and branding. Switch it live in minutes.' },
              { icon: '📊', title: 'Sales analytics', desc: 'Revenue, top sellers, profit per item, busiest hours. The data you need to run a tighter, more profitable operation.' },
              { icon: '📦', title: 'Stock management', desc: 'Set stock levels per item. Sold-out items disappear from the customer menu automatically. No apologising at the hatch.' },
              { icon: '🖨️', title: 'Print menus with QR codes', desc: 'Generate professional A4/A3/A2 menus with a QR code on every item. Display at your pitch or hand out at the gate.' },
              { icon: '💳', title: 'Cashless payments', desc: 'Card, Apple Pay, Google Pay and PayPal. No cash float, no end-of-night counting, no contamination risk.' },
              { icon: '❄️', title: 'No charge in the off-season', desc: 'PAYG pricing means you pay 2% per transaction and nothing else. Park up for the winter and your bill is £0.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex gap-4">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seasonal pitch */}
      <section className="py-20 bg-brand-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-5xl mb-6">❄️</div>
          <h2 className="text-3xl font-extrabold mb-4">Most mobile catering software charges you 12 months a year. Eventifood doesn&apos;t.</h2>
          <p className="text-brand-200 text-lg max-w-2xl mx-auto mb-10">
            Mobile caterers trade seasonally — festivals in summer, Christmas markets in winter, quiet months in between. Eventifood&apos;s PAYG pricing means your bill reflects your trading. When you&apos;re not earning, you&apos;re not paying.
          </p>
          <Link href="/register" className="inline-block bg-gold-400 hover:bg-gold-500 text-white font-bold text-lg py-4 px-12 rounded-xl shadow-xl transition-all">
            Start free — 2% per order when you trade →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-10 text-center text-sm">
        <Link href="/" className="text-brand-400 hover:text-brand-300 font-semibold">← Back to Eventifood</Link>
        <p className="mt-4">© {new Date().getFullYear()} Eventifood. Mobile catering software for UK food vans and street food traders.</p>
      </footer>

    </div>
  )
}
