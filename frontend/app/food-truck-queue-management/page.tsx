import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Food Truck Queue Management Software | Serve 6× More Customers | Eventifood',
  description:
    'Eliminate the food truck queue bottleneck. Customers order on their phone while waiting — your kitchen board shows every order the moment it\'s paid, and their phone buzzes when it\'s ready. No hatch chaos.',
  keywords: [
    'food truck queue management',
    'food van queue management',
    'food truck queue management software',
    'food truck queue system',
    'food truck ordering queue',
    'food truck virtual queue',
    'street food queue management',
    'mobile catering queue system',
    'food truck order management',
  ],
  alternates: { canonical: 'https://eventifood.com/food-truck-queue-management' },
  openGraph: {
    title: 'Food Truck Queue Management Software | Serve 6× More Customers | Eventifood',
    description:
      'Customers order on their phone while waiting. Kitchen board shows every order. Their phone buzzes when ready. No hatch chaos.',
    url: 'https://eventifood.com/food-truck-queue-management',
  },
}

export default function FoodTruckQueueManagementPage() {
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
          <span className="inline-block bg-gold-400/20 border border-gold-400/40 text-gold-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">Queue Management</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Serve <span className="text-gold-400">6× more customers</span><br />
            with the same van
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-10">
            The hatch is a bottleneck because it has to do everything — take the order, handle the payment, answer questions, and call the name when it&apos;s ready. Eventifood moves all of that to the customer&apos;s phone. Your hatch becomes a collection point. Your staff cook.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-gold-500 hover:bg-gold-600 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-lg transition-all">
              Fix your queue today — free →
            </Link>
            <Link href="/" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-lg py-4 px-8 rounded-xl transition-all">
              See all features
            </Link>
          </div>
        </div>
      </section>

      {/* The real cost of the queue */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">What a long queue actually costs you</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">The problem isn&apos;t the queue itself — it&apos;s everything at the hatch that creates it.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {[
              { icon: '💬', title: 'Verbal orders take 90 seconds each', desc: 'For every customer who reaches the hatch, your staff spend over a minute just taking the order — clarifying extras, repeating prices, handling misheard items.' },
              { icon: '💵', title: 'Cash is slow and error-prone', desc: 'Counting money, making change, handing it back. Each cash transaction adds 30–60 seconds per customer and introduces human error and contamination risk.' },
              { icon: '🚶', title: 'Customers walk away', desc: 'Queues of 8+ people are enough for most customers to leave. Every person who walks away is a lost sale — and you never know how many that is.' },
              { icon: '😤', title: 'Staff can\'t focus on cooking', desc: 'The same person who should be flipping burgers is taking orders, handling cash, and shouting names. Splitting that attention slows everything down.' },
            ].map((p) => (
              <div key={p.title} className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <div className="text-2xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
            <p className="text-4xl font-extrabold text-gold-400 mb-2">Every 10 lost customers = lost revenue</p>
            <p className="text-gray-400">If your average order is £10 and 10 customers walk away per service, that&apos;s £100 gone per event. At 50 events a year, that&apos;s £5,000 of revenue your queue is costing you.</p>
          </div>
        </div>
      </section>

      {/* How Eventifood fixes it */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-14">How Eventifood eliminates the queue</h2>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Customers order before they reach the front',
                desc: 'Your QR code is visible from the back of the queue. Customers scan it, browse the menu and place their order while waiting — so by the time they reach the front, they&apos;re already paid.',
              },
              {
                step: '2',
                title: 'The kitchen starts cooking the moment payment clears',
                desc: 'Your kitchen display board shows every paid order instantly. No waiting for the customer to reach the hatch and repeat the order — cooking starts as soon as the payment goes through.',
              },
              {
                step: '3',
                title: 'Customers step aside and wait comfortably',
                desc: 'Once they&apos;ve paid, there&apos;s no reason to hover at the hatch. They move away, the queue clears, and the next person steps up to scan.',
              },
              {
                step: '4',
                title: 'Phone notification tells them when to collect',
                desc: 'You tap &quot;Ready&quot; on the kitchen board. The customer&apos;s phone buzzes. They walk up and collect. No name-calling, no shouting, no hovering at the hatch.',
              },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm flex gap-6 items-start">
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-200">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Result stat */}
      <section className="py-20 bg-gradient-to-br from-gold-50 to-orange-50 border-y border-gold-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-7xl font-extrabold text-brand-600 mb-4">6×</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">faster queue throughput</h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-10">
            Van owners using Eventifood consistently report handling 40–60% more customers per hour at their busiest events — with the same number of staff, same van, same menu. The difference is that staff stop taking orders and start focusing entirely on cooking.
          </p>
          <Link href="/register" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg py-4 px-12 rounded-xl shadow-lg transition-all">
            Start free — fix your queue today →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-10 text-center text-sm">
        <Link href="/" className="text-brand-400 hover:text-brand-300 font-semibold">← Back to Eventifood</Link>
        <p className="mt-4">© {new Date().getFullYear()} Eventifood. Food truck queue management software for UK traders.</p>
      </footer>

    </div>
  )
}
