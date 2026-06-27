import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          🍔 Now in beta
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Eventifood
          <span className="block text-orange-500">Ordering made easy</span>
          <span className="block text-gray-700 text-3xl md:text-4xl font-bold mt-2">for food trucks &amp; events</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Give your customers a beautiful QR-code ordering experience. Manage your menu,
          track orders live, and grow your food truck business — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="btn-primary text-lg py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="btn-secondary text-lg py-3 px-8 rounded-xl"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '📱',
              title: 'QR Code ordering',
              desc: 'Customers scan, browse and order from their phone. No app download required.',
            },
            {
              icon: '🍳',
              title: 'Live kitchen board',
              desc: 'See orders in real-time on your kitchen display. Mark ready in one tap.',
            },
            {
              icon: '📊',
              title: 'Sales analytics',
              desc: 'Track revenue, popular items, and wastage to make smarter decisions.',
            },
          ].map((f) => (
            <div key={f.title} className="card text-center p-8">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Eventifood. All rights reserved.
      </footer>
    </main>
  )
}
