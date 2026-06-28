'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StripeCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/seller/settings/payments/stripe'), 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-green-600 text-2xl">✓</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Stripe setup complete</h1>
        <p className="text-gray-500 text-sm">
          Your Stripe account has been connected. Redirecting you back to payment settings…
        </p>
      </div>
    </div>
  )
}
