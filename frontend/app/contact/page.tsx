'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', wants_demo: false })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenants/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError('Something went wrong — please try emailing us directly at hello@eventifood.com')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-brand-600">eventifood</span>
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← Back to home</Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">Get in touch</span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Talk to us</h1>
          <p className="text-lg text-gray-500">
            Got a question, want to see a live demo, or just want to know if Eventifood is right for your van?
            We&apos;re a small team and we actually reply.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Message received!</h2>
            <p className="text-gray-600 mb-6">We&apos;ll get back to you within one business day.</p>
            <Link href="/" className="inline-block bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors">
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Andy Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="andy@andysburgers.co.uk"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number <span className="text-gray-400">(optional)</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="07700 900 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                placeholder="Tell us about your van, what events you do, or any questions you have…"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.wants_demo}
                onChange={e => setForm(f => ({ ...f, wants_demo: e.target.checked }))}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">I&apos;d like a live demo</span>
                <p className="text-xs text-gray-500 mt-0.5">We&apos;ll set up a 20-minute screen share to walk you through everything and answer questions live.</p>
              </div>
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {sending ? 'Sending…' : 'Send message'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Or email us directly at{' '}
              <a href="mailto:hello@eventifood.com" className="text-brand-600 hover:underline">hello@eventifood.com</a>
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
