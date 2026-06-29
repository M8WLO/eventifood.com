'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface PaymentStatus {
  sandbox_mode: boolean
  payment_mode: 'payg' | 'own'
  stripe_account_id: string
  stripe_onboarding_complete: boolean
  paypal_merchant_id: string
  paypal_onboarding_complete: boolean
  sumup_merchant_code: string
  sumup_enabled: boolean
  sumup_has_key: boolean
}

function StatusBadge({ ok, partial, label }: { ok: boolean; partial?: boolean; label: string }) {
  if (ok) return <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full">{label}</span>
  if (partial) return <span className="text-xs font-semibold px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full">{label}</span>
  return <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-full">{label}</span>
}

export default function PaymentsPage() {
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/payments/status/')
      .then((r) => setStatus(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!status) return <div className="p-8 text-red-500">Failed to load payment settings.</div>

  const isPayg = status.payment_mode === 'payg'

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure how your customers pay you at checkout.
        </p>
      </div>

      {status.sandbox_mode && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <span className="text-2xl shrink-0">🧪</span>
          <div>
            <p className="font-bold text-amber-900 text-sm">Test / sandbox mode active</p>
            <p className="text-xs text-amber-700 mt-0.5">All payments are using test credentials — no real money will move. Safe to try every flow.</p>
          </div>
        </div>
      )}

      {/* Stripe Connect — card payments */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Card payments — Stripe Connect</h2>
        {isPayg && (
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            On Pay As You Go, Stripe Connect is required. The platform collects a 2% fee per order automatically via Stripe.
          </p>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#635bff] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Stripe</p>
              <p className="text-sm text-gray-500">
                {status.stripe_onboarding_complete
                  ? 'Connected — accepting card payments'
                  : status.stripe_account_id
                  ? 'Account created — complete setup to go live'
                  : 'Not connected'}
              </p>
            </div>
          </div>
          <StatusBadge
            ok={status.stripe_onboarding_complete}
            partial={!!status.stripe_account_id && !status.stripe_onboarding_complete}
            label={status.stripe_onboarding_complete ? 'Connected' : status.stripe_account_id ? 'Incomplete' : 'Not set up'}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/seller/settings/payments/stripe" className="btn-primary text-sm inline-block">
            {status.stripe_onboarding_complete ? 'Manage Stripe →' : 'Set up Stripe →'}
          </Link>
          {!status.stripe_onboarding_complete && (
            <span className="text-xs text-gray-400">~5 min setup</span>
          )}
        </div>
      </div>

      {/* Additional payment methods — subscription plans only */}
      {isPayg ? (
        <div className="card bg-gray-50 border border-gray-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h2 className="font-semibold text-gray-700">Additional payment methods</h2>
              <p className="text-sm text-gray-500 mt-1">
                PayPal and SumUp are not available on the Pay As You Go plan. On PAYG, all customer payments
                go through Stripe so the platform fee is collected automatically.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Switch to a subscription plan in <Link href="/seller/plans" className="underline hover:text-gray-600">Plans</Link> to unlock additional payment methods.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700">Additional payment methods</h2>
            <p className="text-sm text-gray-500 mt-1">
              On your plan there is no platform commission. Configure whichever providers you want to offer customers —
              payments go directly to your accounts.
            </p>
          </div>

          {/* PayPal customer checkout */}
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">PP</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">PayPal</p>
                <p className="text-sm text-gray-500">Accept PayPal payments from customers at checkout.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge
                ok={status.paypal_onboarding_complete}
                partial={!!status.paypal_merchant_id && !status.paypal_onboarding_complete}
                label={status.paypal_onboarding_complete ? 'Connected' : status.paypal_merchant_id ? 'Incomplete' : 'Not set up'}
              />
              <div className="flex flex-col items-end gap-0.5">
                <Link href="/seller/payment-portal/paypal" className="btn-secondary text-sm">Configure</Link>
                {!status.paypal_onboarding_complete && <span className="text-xs text-gray-400">~15 min</span>}
              </div>
            </div>
          </div>

          {/* SumUp */}
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">Su</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">SumUp</p>
                <p className="text-sm text-gray-500">Accept card payments online via your SumUp account.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge
                ok={status.sumup_enabled}
                partial={status.sumup_has_key && !status.sumup_enabled}
                label={status.sumup_enabled ? 'Enabled' : status.sumup_has_key ? 'Saved, not enabled' : 'Not set up'}
              />
              <div className="flex flex-col items-end gap-0.5">
                <Link href="/seller/payment-portal/sumup" className="btn-secondary text-sm">Configure</Link>
                {!status.sumup_enabled && <span className="text-xs text-gray-400">~10 min</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
