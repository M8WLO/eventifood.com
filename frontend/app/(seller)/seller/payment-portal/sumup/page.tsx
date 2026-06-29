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
  const [showKey, setShowKey] = useState(false)

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
        <Link href="/seller/payments" className="text-sm text-gray-400 hover:text-gray-600">← Payments</Link>
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
          {
            text: 'Log in to the SumUp Developer Portal at me.sumup.com.',
            note: 'Use the same email and password as your SumUp Business account. Once logged in, click Settings in the left-hand menu, then Developer Settings.',
          },
          {
            text: 'Go to API Keys at me.sumup.com/en-gb/settings/api-keys and click "Create API key".',
            note: 'Your Merchant Account ID (e.g. MJ3ATXY8) is shown in the top-left corner next to your business name — you\'ll need this below.',
          },
          {
            text: 'Give the key a name (e.g. "eventifood.co.uk") and copy it immediately.',
            note: 'The key starts with sup_sk_ and is only shown once. If you miss it, delete and create a new one.',
          },
          {
            text: 'Paste the API key and your Merchant Account ID into the fields below, toggle Enabled, and click Save.',
          },
        ]}
        notes={[
          'You need a SumUp Business account — a personal account will not have Developer Settings or API access.',
          'SumUp charges their own transaction fee (typically 1.69% for online payments) on top of the order total.',
        ]}
      />

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            SumUp API key {hasKey && <span className="text-green-600 font-normal text-xs ml-1">● Key saved</span>}
            <Tooltip text="Your secret API key from the SumUp Developer Portal. Starts with sup_sk_. This is stored securely and never shown again after saving." />
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setShowKey(false) }}
              className="input-field font-mono text-sm pr-10"
              placeholder={hasKey ? 'Enter new key to replace the saved one' : 'sup_sk_…'}
            />
            {apiKey && (
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title={showKey ? 'Hide key' : 'Preview key'}
              >
                {showKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          {showKey && apiKey && (
            <p className="mt-1.5 font-mono text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 tracking-wide">
              {apiKey.length <= 8
                ? '•'.repeat(apiKey.length)
                : `${apiKey.slice(0, 4)}${'•'.repeat(apiKey.length - 8)}${apiKey.slice(-4)}`}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Generate your API key at <a href="https://me.sumup.com/en-gb/settings/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">me.sumup.com → Settings → Developer Settings → API Keys</a>.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            Merchant Account ID
            <Tooltip text="Your unique SumUp merchant identifier. Shown in the top-left corner of me.sumup.com next to your business name — e.g. MJ3ATXY8." />
          </label>
          <input
            value={merchantCode}
            onChange={(e) => setMerchantCode(e.target.value)}
            className="input-field"
            placeholder="e.g. MJ3ATXY8"
          />
          <p className="text-xs text-gray-400 mt-1">Shown in the top-left corner of <a href="https://me.sumup.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">me.sumup.com</a> next to your business name.</p>
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
