import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'QR Code Ordering for Food Trucks — No App Needed | Eventifood',
  description:
    'Let customers order from your food truck by scanning a QR code — no app download, no account. They scan, order, pay and get notified when ready. Works on any phone. Free to set up.',
  keywords: [
    'QR code ordering food truck',
    'food truck QR code ordering system',
    'food van QR code menu',
    'QR code food van ordering',
    'contactless food truck ordering',
    'food truck scan to order',
    'QR code menu food truck no app',
    'mobile food ordering QR code',
  ],
  alternates: { canonical: 'https://eventifood.com/qr-code-ordering' },
  openGraph: {
    title: 'QR Code Ordering for Food Trucks — No App Needed | Eventifood',
    description:
      'Customers scan, order, pay and get notified when ready. No app download, no account. Works on any phone. Free to set up.',
    url: 'https://eventifood.com/qr-code-ordering',
  },
}

export default function QRCodeOrderingPage() {
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
          <span className="inline-block bg-gold-400/20 border border-gold-400/40 text-gold-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">QR Code Ordering</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Your food truck menu,<br />
            <span className="text-gold-400">one scan away</span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto mb-10">
            Customers scan your QR code, browse your full menu, customise their order, pay on their phone and walk away — with a notification pinging them the moment their food is ready. No app download. No queuing at the hatch. No shouted names.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-gold-500 hover:bg-gold-600 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-lg transition-all">
              Get your QR code free →
            </Link>
            <Link href="/" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-lg py-4 px-8 rounded-xl transition-all">
              See all features
            </Link>
          </div>
          <p className="mt-5 text-sm text-purple-300">Free to set up. No monthly fee. 2% per transaction when you trade.</p>
        </div>
      </section>

      {/* No app callout */}
      <section className="py-16 bg-gold-50 border-b border-gold-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-5xl mb-5">📵</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">No app. Just scan.</h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            The biggest barrier to QR ordering is getting customers to download something. With Eventifood, there is nothing to download. Your customer points their camera at the code, the menu opens, they order. It works on every smartphone, every browser, every network.
          </p>
        </div>
      </section>

      {/* Customer journey */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-14">The complete QR ordering journey</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '📷', title: 'Scan the QR code', desc: 'Customer points their camera at your code. Menu opens instantly in their browser — no download, no sign-in.' },
              { step: '2', icon: '🛒', title: 'Browse & customise', desc: 'Full menu with photos, prices, extras and modifiers. Every choice captured perfectly — no back-and-forth with staff.' },
              { step: '3', icon: '💳', title: 'Pay on their phone', desc: 'Card or PayPal, processed in seconds. Apple Pay & Google Pay coming soon via Stripe. Receipt sent by email.' },
              { step: '4', icon: '🔔', title: 'Get notified when ready', desc: 'Their phone buzzes the moment you mark the order ready on your kitchen board. They walk up, collect and go.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
                  {s.step}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where to use */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-14">Where to display your QR code</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: '🚐', title: 'On the van', desc: 'Print and laminate. Stick it beside the hatch window, above the menu board, or on the serving counter. Every customer in the queue sees it.' },
              { icon: '🎪', title: 'At festivals & events', desc: 'Pin one to the queue barrier, one to the fence, one on the van. Customers see it while waiting and order before they even reach the front.' },
              { icon: '🖨️', title: 'On printed menus', desc: 'Your Eventifood print menus have a QR code on every individual item — customers scan what they want and it drops straight into their basket.' },
              { icon: '📦', title: 'On packaging', desc: 'Add your QR code to bags, boxes and napkins. Customers who enjoyed your food last time can scan and reorder next time they see you.' },
              { icon: '📣', title: 'On social media', desc: 'Share your store link on Instagram, TikTok and Facebook. Anyone who sees your post can open your menu and pre-order for when you next park up.' },
              { icon: '📊', title: 'On table cards', desc: 'At seated events or covered markets, a small table card with the QR code means customers can order from their seat — no queue at all.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Printable QR menus */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">QR code on every single menu item</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Eventifood can generate A4, A3 or A2 print-ready menus with an individual QR code on every item. Customers scan the item they want — it drops straight into their basket, skipping the menu browse entirely. Faster ordering, fewer mistakes, happier customers.
          </p>
          <Link href="/register" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg py-4 px-12 rounded-xl shadow-lg transition-all">
            Create your free QR ordering store →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-10 text-center text-sm">
        <Link href="/" className="text-brand-400 hover:text-brand-300 font-semibold">← Back to Eventifood</Link>
        <p className="mt-4">© {new Date().getFullYear()} Eventifood. QR code ordering for UK food trucks and mobile caterers.</p>
      </footer>

    </div>
  )
}
