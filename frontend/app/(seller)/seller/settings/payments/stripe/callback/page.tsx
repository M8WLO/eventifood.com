'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'

export default function StripeCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      setStatus('error')
      setMessage(errorDescription || 'Stripe connection was cancelled or denied.')
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('No authorisation code received from Stripe.')
      return
    }

    api.post('/api/payments/connect/callback/', { code })
      .then(() => {
        setStatus('success')
        setTimeout(() => router.push('/seller/settings/payments'), 2000)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.response?.data?.error || 'Failed to complete Stripe connection. Please try again.')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Connecting your Stripe account…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Stripe connected!</h1>
            <p className="text-gray-500 text-sm">Redirecting you back to payment settings…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 text-2xl">✗</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Connection failed</h1>
            <p className="text-gray-500 text-sm">{message}</p>
            <button
              onClick={() => router.push('/seller/settings/payments/stripe')}
              className="btn-primary w-full mt-4"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
