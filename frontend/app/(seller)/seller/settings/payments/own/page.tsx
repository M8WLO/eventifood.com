'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function OwnPaymentMethodsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isPayg, setIsPayg] = useState(false)

  useEffect(() => {
    api.get('/api/payments/status/')
      .then((r) => {
        if (r.data.payment_mode === 'payg') {
          setIsPayg(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Checking access…</div>

  if (isPayg) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-3xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Not available on Pay As You Go</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Custom payment methods (SumUp, PayPal, your own Stripe account) are only available on plans
            that allow self-managed payment processing.
          </p>
          <p className="text-gray-500 text-sm">
            On the Pay As You Go plan, all payments are processed through the platform Stripe Connect.
            This keeps things simple and secure — no extra setup required.
          </p>
          <div className="space-y-3">
            <Link href="/seller/settings/payments" className="btn-primary w-full block">
              Back to payment settings
            </Link>
            <p className="text-xs text-gray-400">
              Need custom payment processing? Contact support to discuss upgrade options.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your own payment methods</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your own payment providers. Payments go directly to your accounts — no platform fee.
        </p>
      </div>

      <div className="space-y-4">
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

        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#635bff] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">S+</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Your own Stripe account</h3>
              <p className="text-sm text-gray-500">Use your own Stripe secret key — full control, standard Stripe fees only.</p>
            </div>
          </div>
          <Link href="/seller/settings/payments/own/stripe-direct" className="btn-secondary text-sm shrink-0">Configure</Link>
        </div>
      </div>
    </div>
  )
}
