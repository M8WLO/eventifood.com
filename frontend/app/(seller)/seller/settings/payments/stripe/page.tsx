'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface PaymentStatus {
  payment_mode: 'payg' | 'own'
  stripe_account_id: string
  stripe_onboarding_complete: boolean
  connected_at: string | null
}

export default function StripeSettingsPage() {
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    api.get('/api/payments/status/')
      .then((r) => setStatus(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      const r = await api.get('/api/payments/connect/')
      window.location.href = r.data.url
    } catch {
      setError('Could not initiate Stripe connection. Please try again.')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Stripe account? You will no longer be able to accept payments until you reconnect.')) return
    setDisconnecting(true)
    setError('')
    try {
      await api.post('/api/payments/connect/disconnect/')
      load()
    } catch {
      setError('Failed to disconnect. Please try again.')
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!status) return <div className="p-8 text-red-500">Failed to load status.</div>

  const { stripe_account_id, stripe_onboarding_complete, connected_at } = status

  return (
    <div className="p-8 max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stripe Connect</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your Stripe account so customers can pay by card. Payouts go directly to your bank via Stripe.
          {status.payment_mode === 'payg' && ' A 2% platform fee applies to each order.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {stripe_onboarding_complete ? (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">✓</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Stripe account connected</p>
              <p className="text-xs text-gray-400">
                Account ID: {stripe_account_id}
                {connected_at && ` · Connected ${new Date(connected_at).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            You&apos;re all set to accept card payments. Stripe handles all payment processing and pays out directly to your bank account.
          </p>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect Stripe account'}
          </button>
        </div>
      ) : stripe_account_id ? (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-lg">!</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Stripe setup incomplete</p>
              <p className="text-xs text-gray-400">You started onboarding but haven&apos;t finished. Complete setup to accept payments.</p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="btn-primary w-full"
          >
            {connecting ? 'Redirecting to Stripe…' : 'Continue Stripe setup →'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50 block"
          >
            {disconnecting ? 'Removing…' : 'Start over / remove partial connection'}
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <p className="text-sm text-gray-700">
            You haven&apos;t connected a Stripe account yet. Click below to be taken to Stripe where you can create or link an existing account.
            Stripe will verify your identity and bank details — this usually takes a few minutes.
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Funds paid out directly to your bank account</li>
            <li>Stripe handles all card processing and PCI compliance</li>
            <li>View your payouts and transactions in the Stripe dashboard</li>
          </ul>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="btn-primary w-full"
          >
            {connecting ? 'Redirecting to Stripe…' : 'Connect with Stripe →'}
          </button>
        </div>
      )}
    </div>
  )
}
