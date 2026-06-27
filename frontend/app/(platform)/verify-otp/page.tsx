'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { setToken } from '@/lib/auth'

function VerifyOTPForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const partialToken = searchParams.get('token') || ''
  const redirectTo = searchParams.get('redirect') || '/seller/dashboard'

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/verify-otp/', {
        partial_token: partialToken,
        code,
      })
      setToken(data.access, data.refresh)
      router.push(redirectTo)
    } catch {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await api.post('/api/auth/resend-otp/', { partial_token: partialToken })
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch {
      setError('Could not resend code.')
    }
  }

  return (
    <main className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Check your email</h1>
          <p className="text-gray-500 mt-2 text-sm">
            We sent a 6-digit code to your email. Enter it below to sign in.
          </p>
        </div>
        {process.env.NEXT_PUBLIC_TEST_MODE === 'true' && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 text-center">
            <span className="font-semibold">Test mode:</span> enter code <span className="font-mono font-bold tracking-widest">000000</span>
          </div>
        )}
        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                className="input-field text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            {resent && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">Code resent!</p>}
            <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full">
              {loading ? 'Verifying…' : 'Verify & sign in'}
            </button>
          </form>
          <button
            onClick={handleResend}
            className="mt-4 text-sm text-brand-600 hover:underline w-full text-center"
          >
            Resend code
          </button>
        </div>
      </div>
    </main>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense>
      <VerifyOTPForm />
    </Suspense>
  )
}
