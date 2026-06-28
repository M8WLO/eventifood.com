'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { SetupGuide } from '@/components/SetupGuide'
import { Tooltip } from '@/components/Tooltip'

export default function SumUpConfigPage() {
  const [apiKey, setApiKey] = useState('')
  const [merchantCode, setMerchantCode] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/payments/providers/')
      .then((r) => {
        setMerchantCode(r.data.sumup_merchant_code || '')
        setEnabled(r.data.sumup_enabled)
        setHasKey(r.data.sumup_has_key)
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setError(null)
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { sumup_merchant_code: merchantCode }
      if (apiKey) payload.sumup_api_key = apiKey
      payload.sumup_enabled = enabled
      const { data } = await api.patch('/api/payments/providers/', payload)
      setMerchantCode(data.sumup_merchant_code || '')
      setHasKey(data.sumup_has_key)
      setEnabled(data.sumup_enabled)
      setApiKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to save SumUp settings.')
    } finally {
      setSaving(false)
    }
  }

  const disable = async () => {
    setSaving(true)
    try {
      await api.patch('/api/payments/providers/', { sumup_enabled: false })
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
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">Su</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SumUp</h1>
          <p className="text-sm text-gray-500">Connect your SumUp account to accept card payments online.</p>
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        When customers check out, they pay via SumUp&apos;s hosted page. Payments go directly into your SumUp account — no platform commission applies.
      </div>

      <SetupGuide
        time="~10 minutes"
        steps={[
          { text: 'Go to developer.sumup.com and sign in to your SumUp Business account.' },
          { text: 'Navigate to API Keys and create a new key.', note: 'The key starts with sup_sk_ — copy it immediately, it\'s only shown once.' },
          { text: 'Paste the key into the "SumUp API key" field below and save.' },
          { text: 'Find your Merchant Code in the SumUp mobile app: tap Account → Profile.', note: 'It looks like MXXXXXXX — a capital M followed by 7 digits.' },
          { text: 'Enter the merchant code, toggle Enabled, and click Save.' },
        ]}
        notes={[
          'You need a SumUp Business account — a personal account will not have API access.',
          'SumUp charges their own transaction fee (typically 1.69% for online payments) on top of the order total.',
        ]}
      />

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            SumUp API key {hasKey && <span className="text-green-600 font-normal text-xs ml-1">● Key saved</span>}
            <Tooltip text="Your secret API key from the SumUp Developer Portal. Starts with sup_sk_. This is stored securely and never shown again after saving." />
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input-field font-mono text-sm"
            placeholder={hasKey ? 'Enter new key to replace the saved one' : 'sup_sk_…'}
          />
          <p className="text-xs text-gray-400 mt-1">
            Find your API key in the SumUp Developer Portal under API Keys.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            Merchant code
            <Tooltip text="Your unique SumUp merchant identifier. Find it in the SumUp app under Account → Profile. Looks like MXXXXXXX." />
          </label>
          <input
            value={merchantCode}
            onChange={(e) => setMerchantCode(e.target.value)}
            className="input-field"
            placeholder="e.g. MXXXXXXX"
          />
          <p className="text-xs text-gray-400 mt-1">Visible in the SumUp app: Account → Profile.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <div className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-gray-200'}`} />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium text-gray-800">
              {enabled ? 'Enabled — SumUp offered at checkout' : 'Disabled'}
            </span>
          </label>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save SumUp settings'}
          </button>
          {enabled && (
            <button onClick={disable} disabled={saving} className="text-sm text-red-500 hover:text-red-700 font-medium">
              Disable SumUp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
