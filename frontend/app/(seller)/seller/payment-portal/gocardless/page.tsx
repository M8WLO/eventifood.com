'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { SetupGuide } from '@/components/SetupGuide'
import { Tooltip } from '@/components/Tooltip'

export default function GoCardlessConfigPage() {
  const [accessToken, setAccessToken] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/payments/providers/')
      .then((r) => {
        setEnabled(r.data.gocardless_enabled)
        setHasToken(r.data.gocardless_has_token)
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setError(null)
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { gocardless_enabled: enabled }
      if (accessToken) payload.gocardless_access_token = accessToken
      const { data } = await api.patch('/api/payments/providers/', payload)
      setHasToken(data.gocardless_has_token)
      setEnabled(data.gocardless_enabled)
      setAccessToken('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to save GoCardless settings.')
    } finally {
      setSaving(false)
    }
  }

  const disable = async () => {
    setSaving(true)
    try {
      await api.patch('/api/payments/providers/', { gocardless_enabled: false })
      setEnabled(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/seller/payment-portal" className="text-sm text-gray-400 hover:text-gray-600">← Payment Portal</Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#1d3557] rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">GC</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GoCardless</h1>
          <p className="text-sm text-gray-500">Collect Direct Debit payments from customers via GoCardless.</p>
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        GoCardless is ideal for regular customers who prefer Direct Debit. Customers authorise a mandate once — no card details needed for repeat orders. Payments go directly to your GoCardless account.
      </div>

      <SetupGuide
        time="~10 minutes · mandates take 3–5 working days"
        steps={[
          { text: 'Sign in to your GoCardless dashboard at manage.gocardless.com.' },
          { text: 'Go to Developers → Access tokens in the left sidebar.' },
          { text: 'Click "Create token" and select Live (not Sandbox).', note: 'A sandbox token starts with sandbox_ and won\'t work in production.' },
          { text: 'Copy the token starting with live_ and paste it into the field below.' },
          { text: 'Toggle Enabled and click Save. GoCardless will appear as a payment option at checkout.' },
        ]}
        notes={[
          'You need a verified GoCardless merchant account before you can issue live tokens. Apply at gocardless.com if you don\'t have one.',
          'Direct Debit mandates take 3–5 working days to confirm after a customer authorises them. GoCardless notifies you when payments clear.',
          'GoCardless charges their own transaction fee — check your GoCardless plan for the rate.',
        ]}
      />

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            GoCardless access token {hasToken && <span className="text-green-600 font-normal text-xs ml-1">● Token saved</span>}
            <Tooltip text="Your live API access token from the GoCardless dashboard. Starts with live_. This is stored securely and never shown again after saving." />
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="input-field font-mono text-sm"
            placeholder={hasToken ? 'Enter new token to replace the saved one' : 'live_…'}
          />
          <p className="text-xs text-gray-400 mt-1">
            GoCardless dashboard → Developers → Access tokens. Use a <code className="bg-gray-100 px-1 rounded">live_</code> token, not sandbox.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <div className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-gray-200'}`} />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium text-gray-800">
              {enabled ? 'Enabled — GoCardless offered at checkout' : 'Disabled'}
            </span>
          </label>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save GoCardless settings'}
          </button>
          {enabled && (
            <button onClick={disable} disabled={saving} className="text-sm text-red-500 hover:text-red-700 font-medium">
              Disable GoCardless
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
