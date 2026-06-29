'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { setToken } from '@/lib/auth'
import Cookies from 'js-cookie'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setErrorMsg('No verification token found in the link. Please check your email and try again.')
      return
    }

    api.post('/api/auth/verify-email/', { token })
      .then((r) => {
        setToken(r.data.access, r.data.refresh)
        if (r.data.tenant_slug) {
          Cookies.set('tenant_slug', r.data.tenant_slug, { expires: 7, sameSite: 'lax' })
        }
        setStatus('success')
        setTimeout(() => router.push('/seller/dashboard'), 1500)
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err?.response?.data?.detail || 'Verification failed. The link may have expired.')
      })
  }, [searchParams, router])

  return (
    <div className="w-full max-w-md text-center">
      {status === 'verifying' && (
        <>
          <div className="text-4xl mb-4 animate-pulse">📬</div>
          <h1 className="text-xl font-bold text-gray-800">Verifying your email…</h1>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Email verified!</h1>
          <p className="text-gray-500">Your store is now active. Taking you to your dashboard…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verification failed</h1>
          <p className="text-gray-500 mb-6">{errorMsg}</p>
          <a href="/register" className="text-brand-600 hover:underline font-medium text-sm">
            Register again →
          </a>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="w-full max-w-md text-center">
          <div className="text-4xl mb-4 animate-pulse">📬</div>
          <h1 className="text-xl font-bold text-gray-800">Verifying your email…</h1>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </main>
  )
}
