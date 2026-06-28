'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

export default function PayPalConfigPage() {
  const [email, setEmail] = useState('')
  const [savedEmail, setSavedEmail] = useState('')
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/api/payments/providers/')
      .then((r) => {
        const e = r.data.paypal_merchant_id || ''
        setEmail(e)
        setSavedEmail(e)
        setComplete(r.data.paypal_onboarding_complete)
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setError(null)
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid PayPal Business email address.')
      return
    }
    setSaving(true)
    try {
      await api.patch('/api/payments/providers/', { paypal_merchant_id: email.trim() })
      setSavedEmail(email.trim())
      setComplete(true)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async () => {
    setSaving(true)
    try {
      await api.patch('/api/payments/providers/', { paypal_merchant_id: '' })
      setEmail('')
      setSavedEmail('')
      setComplete(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Link href="/seller/payment-portal" className="text-sm text-gray-400 hover:text-gray-600">← Payment Portal</Link>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#003087] rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">PP</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PayPal</h1>
          <p className="text-sm text-gray-500">Customers pay you directly via PayPal — no platform commission.</p>
        </div>
      </div>

      {complete && savedEmail ? (
        <div className="card space-y-4">
          <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">PayPal connected</p>
              <p className="text-xs text-green-700 mt-0.5">{savedEmail}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Customers will see a <strong>Pay with PayPal</strong> option at checkout. Payments go directly to this PayPal account.
          </p>
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Change email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@paypal.com"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={save} disabled={saving || email === savedEmail} className="btn-primary text-sm disabled:opacity-40">
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Update email'}
              </button>
              <button onClick={disconnect} disabled={saving} className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50">
                Disconnect PayPal
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">How it works</p>
            <ul className="text-sm text-gray-500 space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-brand-500 font-bold mt-0.5">1.</span> Enter your PayPal Business email address below</li>
              <li className="flex items-start gap-2"><span className="text-brand-500 font-bold mt-0.5">2.</span> Save — that&apos;s it. No API keys or developer setup needed</li>
              <li className="flex items-start gap-2"><span className="text-brand-500 font-bold mt-0.5">3.</span> Customers see a <strong>Pay with PayPal</strong> button at checkout and pay you directly</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-0.5">You need a PayPal Business account</p>
            <p className="text-blue-700 text-xs">
              Personal PayPal accounts work too, but a Business account lets you accept payments under your business name.
              Sign up free at paypal.com.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your PayPal Business email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              className="input-field"
              placeholder="yourname@example.com"
              autoComplete="email"
            />
            <p className="text-xs text-gray-400 mt-1">This is the email address on your PayPal account — not your Eventifood login.</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={save} disabled={saving || !email.trim()} className="btn-primary disabled:opacity-40">
            {saving ? 'Connecting…' : 'Connect PayPal →'}
          </button>
        </div>
      )}
    </div>
  )
}
