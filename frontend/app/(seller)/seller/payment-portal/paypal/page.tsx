'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

export default function PayPalConfigPage() {
  const [merchantId, setMerchantId] = useState('')
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/payments/providers/')
      .then((r) => {
        setMerchantId(r.data.paypal_merchant_id || '')
        setComplete(r.data.paypal_onboarding_complete)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/seller/payment-portal" className="text-sm text-gray-400 hover:text-gray-600">← Payment Portal</Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#003087] rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">PP</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PayPal</h1>
          <p className="text-sm text-gray-500">Accept PayPal payments from customers via PayPal Commerce Platform.</p>
        </div>
      </div>

      {merchantId && complete ? (
        <div className="card space-y-4">
          <div className="flex items-center gap-3 text-green-700 bg-green-50 rounded-xl px-4 py-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-semibold">PayPal connected</p>
              <p className="text-xs text-green-600 mt-0.5">Merchant ID: {merchantId}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">PayPal is live and offered as a payment option during customer checkout.</p>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800 space-y-1">
            <p className="font-semibold">PayPal Commerce Platform — coming soon</p>
            <p>
              PayPal seller onboarding requires OAuth and review on our end. This integration is currently being set up.
              Contact support to get early access.
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="font-medium text-gray-800">What you&apos;ll need:</p>
            <ul className="space-y-1 list-disc list-inside text-gray-500">
              <li>A PayPal Business account</li>
              <li>Your PayPal Merchant ID (from Account settings → Business information)</li>
              <li>Approval via PayPal Commerce Platform onboarding</li>
            </ul>
          </div>

          <p className="text-xs text-gray-400">
            Once enabled, customers will see a PayPal button at checkout alongside or instead of card payment.
            Payments go directly to your PayPal account — no platform commission.
          </p>
        </div>
      )}
    </div>
  )
}
