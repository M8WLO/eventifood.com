'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface PaymentStatus {
  payment_mode: 'payg' | 'own'
  stripe_account_id: string
  stripe_onboarding_complete: boolean
  connected_at: string | null
}

export default function PaymentSettingsPage() {
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/payments/status/')
      .then((r) => setStatus(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading payment settings…</div>
  if (!status) return <div className="p-8 text-red-500">Failed to load payment settings.</div>

  const isPayg = status.payment_mode === 'payg'

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isPayg
            ? 'You are on Pay As You Go — Stripe Connect is your payment method. No monthly fee; 2% platform fee per order.'
            : 'You have access to custom payment methods. Connect whichever providers you\'d like to offer customers.'}
        </p>
      </div>

      {/* Stripe Connect — available to everyone */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#635bff] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Stripe (platform payments)</h2>
              <p className="text-sm text-gray-500">
                {isPayg
                  ? 'Connect your Stripe account to receive payments. Platform takes 2% per order.'
                  : 'Accept card payments via Stripe Connect.'}
              </p>
            </div>
          </div>
          {status.stripe_onboarding_complete ? (
            <span className="shrink-0 text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full">Connected</span>
          ) : status.stripe_account_id ? (
            <span className="shrink-0 text-xs font-semibold px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full">Setup incomplete</span>
          ) : (
            <span className="shrink-0 text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-full">Not connected</span>
          )}
        </div>
        <div className="mt-4">
          <Link href="/seller/settings/payments/stripe" className="btn-primary text-sm inline-block">
            {status.stripe_onboarding_complete ? 'Manage Stripe connection' : 'Set up Stripe →'}
          </Link>
        </div>
      </div>

      {/* Own payment methods — blocked for PAYG */}
      {isPayg ? (
        <div className="card bg-gray-50 border border-gray-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h2 className="font-semibold text-gray-700">Additional payment methods</h2>
              <p className="text-sm text-gray-500 mt-1">
                Alternative payment methods (SumUp, PayPal, your own Stripe keys) are not available on the Pay As You Go plan.
                All payments are processed through the platform Stripe Connect.
              </p>
              <p className="text-xs text-gray-400 mt-2">Contact support if you need a custom payment arrangement.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">Additional payment methods</h2>

          {/* SumUp */}
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">Su</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">SumUp</h3>
                <p className="text-sm text-gray-500">Accept in-person card payments via SumUp card reader.</p>
              </div>
            </div>
            <Link href="/seller/settings/payments/own/sumup" className="btn-secondary text-sm shrink-0">Configure</Link>
          </div>

          {/* PayPal */}
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">PP</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">PayPal</h3>
                <p className="text-sm text-gray-500">Accept PayPal payments via PayPal Commerce Platform.</p>
              </div>
            </div>
            <Link href="/seller/settings/payments/own/paypal" className="btn-secondary text-sm shrink-0">Configure</Link>
          </div>

          {/* Own Stripe */}
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#635bff] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">S+</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Your own Stripe account</h3>
                <p className="text-sm text-gray-500">Use your own Stripe secret key — full control, standard Stripe fees.</p>
              </div>
            </div>
            <Link href="/seller/settings/payments/own/stripe-direct" className="btn-secondary text-sm shrink-0">Configure</Link>
          </div>
        </div>
      )}
    </div>
  )
}
