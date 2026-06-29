'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function StripeCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'syncing' | 'complete' | 'incomplete'>('syncing')

  useEffect(() => {
    api.post('/api/payments/connect/sync/')
      .then((r) => {
        if (r.data.stripe_onboarding_complete) {
          setStatus('complete')
          setTimeout(() => router.push('/seller/settings/payments/stripe'), 2000)
        } else {
          setStatus('incomplete')
          setTimeout(() => router.push('/seller/settings/payments/stripe'), 3000)
        }
      })
      .catch(() => {
        setStatus('incomplete')
        setTimeout(() => router.push('/seller/settings/payments/stripe'), 3000)
      })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-4">
        {status === 'syncing' && (
          <>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-blue-600 text-2xl animate-spin">↻</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Checking your Stripe account…</h1>
            <p className="text-gray-500 text-sm">This only takes a moment.</p>
          </>
        )}
        {status === 'complete' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Stripe connected!</h1>
            <p className="text-gray-500 text-sm">Your account is ready to accept payments. Redirecting…</p>
          </>
        )}
        {status === 'incomplete' && (
          <>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-yellow-600 text-2xl">!</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Almost there</h1>
            <p className="text-gray-500 text-sm">Stripe hasn&apos;t fully activated your account yet — this can take a few minutes. Redirecting to check status…</p>
          </>
        )}
      </div>
    </div>
  )
}
