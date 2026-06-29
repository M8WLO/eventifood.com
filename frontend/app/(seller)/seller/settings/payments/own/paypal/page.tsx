'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function PayPalSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [sandboxMode, setSandboxMode] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/api/payments/status/')
      .then((r) => {
        setEmail(r.data.paypal_merchant_id || '')
        setEnabled(r.data.paypal_onboarding_complete || false)
        setSandboxMode(r.data.sandbox_mode || false)
      })
      .catch(() => setError('Failed to load payment settings.'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your PayPal Business email address.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await api.patch('/api/payments/providers/alternative/', { paypal_merchant_id: trimmed })
      setEnabled(true)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await api.patch('/api/payments/providers/alternative/', { paypal_merchant_id: '' })
      setEmail('')
      setEnabled(false)
      setSuccess(false)
    } catch {
      setError('Failed to disconnect PayPal.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">PayPal</h1>
          <p className="text-sm text-gray-500">Accept PayPal payments from your customers</p>
        </div>
      </div>

      {sandboxMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Sandbox mode active</span> — PayPal transactions will use the sandbox environment. No real money moves.
        </div>
      )}

      <div className="card space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">PP</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">PayPal Business</p>
            <p className="text-xs text-gray-500">Customers pay via PayPal — funds go directly to your PayPal account</p>
          </div>
          {enabled && (
            <span className="ml-auto text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">Connected</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PayPal Business email {sandboxMode && <span className="text-amber-600">(sandbox)</span>}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSuccess(false) }}
            placeholder={sandboxMode ? 'sb-seller@business.example.com' : 'your-business@example.com'}
            className="input-field"
          />
          <p className="text-xs text-gray-400 mt-1">
            {sandboxMode
              ? 'Enter your PayPal sandbox Business email (from developer.paypal.com).'
              : 'Enter the email address of your PayPal Business account. Payments go directly to this account.'}
          </p>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">PayPal saved — customers will now see a PayPal option at checkout.</p>}

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving…' : enabled ? 'Update email' : 'Connect PayPal'}
          </button>
          {enabled && (
            <button
              onClick={disconnect}
              disabled={saving}
              className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 transition-colors disabled:opacity-50"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-100 space-y-2">
        <p className="text-sm font-semibold text-blue-800">How it works</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>At checkout, customers can choose to pay with PayPal</li>
          <li>They're redirected to PayPal to approve the payment</li>
          <li>Funds land directly in your PayPal Business account</li>
          <li>Your order board receives the order automatically once payment is confirmed</li>
        </ul>
      </div>
    </div>
  )
}
