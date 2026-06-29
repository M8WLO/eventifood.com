'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'

export default function GoCardlessCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const redirectFlowId = searchParams.get('redirect_flow_id')
    const sessionToken = sessionStorage.getItem('gc_session_token')
    const planId = sessionStorage.getItem('gc_plan_id')
    const period = sessionStorage.getItem('gc_period') || 'monthly'

    if (!redirectFlowId || !sessionToken || !planId) {
      setErrorMsg('Missing authorisation details. Please try again from the payment portal.')
      setStatus('error')
      return
    }

    api.post('/api/payments/gocardless/complete/', {
      redirect_flow_id: redirectFlowId,
      session_token: sessionToken,
      plan_id: Number(planId),
      period,
    })
      .then(() => {
        sessionStorage.removeItem('gc_session_token')
        sessionStorage.removeItem('gc_plan_id')
        sessionStorage.removeItem('gc_period')
        setStatus('success')
        setTimeout(() => router.push('/seller/payment-portal?switched=gocardless'), 1500)
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || 'Failed to complete Direct Debit setup. Please try again.'
        setErrorMsg(msg)
        setStatus('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Setting up your Direct Debit…</p>
          <p className="text-sm text-gray-400">Please wait, do not close this tab.</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">✅</div>
          <p className="text-gray-800 font-semibold text-lg">Direct Debit authorised!</p>
          <p className="text-sm text-gray-500">Your plan is now active. Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-5xl">❌</div>
        <p className="text-gray-800 font-semibold text-lg">Something went wrong</p>
        <p className="text-sm text-red-500">{errorMsg}</p>
        <button
          onClick={() => router.push('/seller/payment-portal')}
          className="btn-secondary text-sm"
        >
          ← Back to Payment Portal
        </button>
      </div>
    </div>
  )
}
