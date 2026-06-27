import Image from 'next/image'
import Link from 'next/link'

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

const plans: Array<{
  name: string; price: string; period: string; description: string;
  features: string[]; cta: string; href: string; highlight: boolean; comingSoon?: boolean;
}> = [
  {
    name: 'Starter',
    price: '£0',
    period: 'Free forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 5 menu items',
      'QR code ordering',
      'Live kitchen board',
      'Basic sales reports',
      'Email support',
    ],
    cta: 'Get started free',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '£29',
    period: 'per month',
    description: 'For busy vans & serious sellers',
    features: [
      'Unlimited menu items',
      'Product variations (size, extras, options)',
      'Advanced analytics & profit tracking',
      'Inventory management with low-stock alerts',
      'Custom branded storefront',
      'Staff accounts',
      'Priority support',
    ],
    cta: 'Start 14-day free trial',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Event',
    price: '£79',
    period: 'per month',
    description: 'For multi-van operators & festivals',
    features: [
      'Everything in Pro',
      'Multiple locations / vans',
      'Event-mode bulk QR printing',
      'Festival & market integrations',
      'Dedicated account manager',
      'SLA support',
    ],
    cta: 'Coming soon',
    href: '#pricing',
    highlight: false,
    comingSoon: true,
  },
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
      <section className="py-20 bg-brand-50">
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
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-7 flex flex-col ${
                  plan.highlight
                    ? 'border-brand-500 bg-brand-600 text-white shadow-2xl shadow-brand-200 md:-mt-4'
                    : plan.comingSoon
                    ? 'border-gray-200 bg-gray-50 opacity-75'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="self-start bg-gold-400 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">Most popular</span>
                )}
                {plan.comingSoon && (
                  <span className="self-start bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">Coming soon</span>
                )}
                <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${plan.highlight ? 'text-brand-200' : 'text-brand-500'}`}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-brand-200' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-brand-200' : 'text-gray-500'}`}>{plan.description}</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-brand-100' : 'text-gray-600'}`}>
                      <span className={`mt-0.5 flex-shrink-0 font-bold ${plan.highlight ? 'text-gold-300' : 'text-brand-500'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.comingSoon ? (
                  <span className="block text-center font-bold py-3 rounded-xl bg-gray-200 text-gray-500 cursor-not-allowed">
                    Coming soon
                  </span>
                ) : (
                  <Link
                    href={plan.href}
                    className={`block text-center font-bold py-3 rounded-xl transition-all ${
                      plan.highlight
                        ? 'bg-gold-400 hover:bg-gold-500 text-white shadow-lg'
                        : 'bg-brand-600 hover:bg-brand-700 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-brand-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
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
