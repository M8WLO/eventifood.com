'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Plan {
  id: number
  name: string
  description: string
  billing_model: string
  monthly_price: string
  annual_price: string
  platform_fee_percent: string
  features: string[]
}

interface PaymentStatus {
  payment_mode: string
  paypal_merchant_id: string
  paypal_onboarding_complete: boolean
  gocardless_enabled: boolean
  gocardless_has_token: boolean
  stripe_account_id: string
  stripe_onboarding_complete: boolean
}

function StepDot({ n, current }: { n: number; current: number }) {
  const done = current > n
  const active = current === n
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
      done ? 'bg-green-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
    }`}>
      {done ? '✓' : n}
    </div>
  )
}

function StepBar({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <StepDot n={s} current={step} />
          {s < total && <div className={`h-0.5 w-8 rounded ${step > s ? 'bg-green-400' : 'bg-gray-100'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function PlanSwitchWizard() {
  const { planId } = useParams<{ planId: string }>()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'gocardless' | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [paypalRedirecting, setPaypalRedirecting] = useState(false)
  const [gcRedirecting, setGcRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/subscriptions/plans/'),
      api.get('/api/payments/status/'),
    ]).then(([plansRes, statusRes]) => {
      const found = (plansRes.data || []).find((p: Plan) => p.id === Number(planId))
      setPlan(found ?? null)
      const s: PaymentStatus = statusRes.data
      setPaymentStatus(s)
      // Pre-select payment method if already configured
      if (s.paypal_onboarding_complete) setPaymentMethod('paypal')
      else if (s.gocardless_enabled) setPaymentMethod('gocardless')
    }).finally(() => setLoading(false))
  }, [planId])

  const isPayg = plan?.billing_model === 'payg'
  const monthlyPrice = Number(plan?.monthly_price ?? 0)
  const annualPrice = Number(plan?.annual_price ?? 0)
  const hasBothPeriods = monthlyPrice > 0 && annualPrice > 0
  const yearTotal = billingPeriod === 'monthly' ? monthlyPrice * 12 : annualPrice
  const savingPct = hasBothPeriods ? Math.round(100 - (annualPrice / (monthlyPrice * 12)) * 100) : 0
  const feePercent = Number(plan?.platform_fee_percent ?? 2).toFixed(1)

  // PAYG: activate via /my-plan/ directly (Stripe Connect set at Stripe's hosted page)
  const activatePayg = async () => {
    setActivating(true)
    setError(null)
    try {
      await api.post('/api/subscriptions/my-plan/', { plan_id: Number(planId) })
      router.push('/seller/payment-portal?switched=payg')
    } catch {
      setError('Failed to activate plan. Please try again.')
    } finally {
      setActivating(false)
    }
  }

  // Subscription via GoCardless: get redirect flow URL → redirect browser to GC
  const redirectToGoCardless = async () => {
    setGcRedirecting(true)
    setError(null)
    try {
      const { data } = await api.post('/api/payments/gocardless/redirect/', {
        plan_id: Number(planId),
        period: billingPeriod,
      })
      if (data.redirect_url && data.session_token) {
        sessionStorage.setItem('gc_session_token', data.session_token)
        sessionStorage.setItem('gc_plan_id', String(planId))
        sessionStorage.setItem('gc_period', billingPeriod)
        window.location.href = data.redirect_url
      } else {
        setError('GoCardless did not return a redirect URL. Please try again.')
        setGcRedirecting(false)
      }
    } catch {
      setError('Could not start GoCardless setup. Please try again.')
      setGcRedirecting(false)
    }
  }

  // Subscription via PayPal: get approval URL → redirect browser to PayPal
  const redirectToPayPal = async () => {
    setPaypalRedirecting(true)
    setError(null)
    try {
      const { data } = await api.post(
        `/api/subscriptions/paypal/create/?period=${billingPeriod}`,
        { plan_id: Number(planId) },
      )
      if (data.approval_url) {
        window.location.href = data.approval_url
      } else {
        setError('PayPal did not return an approval URL. Please try again.')
        setPaypalRedirecting(false)
      }
    } catch {
      setError('Could not start PayPal checkout. Please try again.')
      setPaypalRedirecting(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!plan) return (
    <div className="p-8 max-w-xl mx-auto text-center space-y-4">
      <p className="text-red-500 font-semibold">Plan not found.</p>
      <Link href="/seller/payment-portal" className="btn-secondary text-sm inline-block">← Back to Payment Portal</Link>
    </div>
  )

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <Link href="/seller/payment-portal" className="text-sm text-gray-400 hover:text-gray-600">← Payment Portal</Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isPayg ? 'Switch to Pay As You Go' : `Switch to ${plan.name}`}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Complete all steps to activate this plan.</p>
      </div>

      <StepBar step={step} total={isPayg ? 3 : 2} />

      {/* ── STEP 1: Summary ─────────────────────────────────── */}
      {step === 1 && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-800">What you&apos;re committing to</h2>

          {isPayg ? (
            <div className="space-y-4 text-sm">
              <div className="bg-brand-50 rounded-xl px-4 py-3">
                <p className="font-bold text-brand-800 text-lg">{feePercent}% per order — no monthly charge</p>
                <p className="text-brand-600 mt-0.5">You only pay the platform when your customers pay you.</p>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex gap-2"><span className="text-green-500 shrink-0">✓</span> {feePercent}% platform fee deducted automatically from each order</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">✓</span> £0/month when you&apos;re not trading</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">✓</span> Card payments via Stripe — money arrives in your bank account</li>
                <li className="flex gap-2"><span className="text-green-500 shrink-0">✓</span> PayPal, SumUp and GoCardless are not available on PAYG</li>
              </ul>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800">
                <p className="font-semibold mb-0.5">Important</p>
                <p>On PAYG all customer payments must go through Stripe so the platform fee is collected automatically. You&apos;ll need to connect your Stripe account in the next step.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-brand-50 rounded-xl px-4 py-3">
                <p className="font-bold text-brand-800">{plan.name}</p>
                {plan.description && <p className="text-sm text-brand-600 mt-0.5">{plan.description}</p>}
              </div>

              {/* Billing period toggle */}
              {hasBothPeriods && (
                <div className="flex gap-2">
                  {(['monthly', 'annual'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setBillingPeriod(p)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        billingPeriod === p ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {p === 'monthly' ? 'Monthly' : 'Annual'}
                      {p === 'annual' && savingPct > 0 && (
                        <span className="ml-1.5 text-xs text-green-600 font-semibold">Save {savingPct}%</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Cost breakdown */}
              <div className="border rounded-xl divide-y text-sm">
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-gray-600">{billingPeriod === 'monthly' ? 'Monthly payment' : 'Annual payment'}</span>
                  <span className="font-bold text-gray-900">
                    £{billingPeriod === 'monthly' ? monthlyPrice.toFixed(2) : annualPrice.toFixed(2)}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-gray-600">Total cost in first year</span>
                  <span className="font-semibold text-gray-900">£{yearTotal.toFixed(2)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-gray-600">Platform commission on orders</span>
                  <span className="font-semibold text-green-700">None</span>
                </div>
              </div>

              {plan.features?.length > 0 && (
                <ul className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-green-500 shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button onClick={() => setStep(2)} className="btn-primary w-full">
            Continue to payment setup →
          </button>
        </div>
      )}

      {/* ── STEP 2 (PAYG): Stripe Connect ───────────────────── */}
      {step === 2 && isPayg && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-800">Connect your Stripe account</h2>
          <p className="text-sm text-gray-500">
            On PAYG, customers pay by card through Stripe. The platform fee is deducted automatically — you receive the rest directly to your bank account.
          </p>

          {paymentStatus?.stripe_onboarding_complete ? (
            <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-green-800">Stripe connected</p>
                <p className="text-xs text-green-600 mt-0.5">Account: {paymentStatus.stripe_account_id}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 space-y-1.5">
                <p className="font-semibold">What you&apos;ll need</p>
                <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                  <li>A Stripe account — free to create at stripe.com</li>
                  <li>Your business name and address</li>
                  <li>Your bank account details for payouts</li>
                  <li>About 5 minutes to complete the onboarding</li>
                </ul>
              </div>
              <Link href="/seller/settings/payments/stripe" className="btn-primary block text-center text-sm">
                Set up Stripe →
              </Link>
              <p className="text-xs text-gray-400 text-center">
                Stripe will open their onboarding wizard. Come back here when done.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary text-sm px-4">← Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!paymentStatus?.stripe_onboarding_complete}
              className="btn-primary text-sm flex-1 disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 (PAYG): Confirm & activate ───────────────── */}
      {step === 3 && isPayg && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-800">Confirm & activate Pay As You Go</h2>

          <div className="border rounded-xl divide-y text-sm">
            <div className="px-4 py-3 flex justify-between">
              <span className="text-gray-600">Plan</span>
              <span className="font-semibold text-gray-900">{plan.name}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-gray-600">Platform fee</span>
              <span className="font-semibold text-gray-900">{feePercent}% per order</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-gray-600">Monthly charge</span>
              <span className="font-semibold text-green-700">£0</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-gray-600">Stripe account</span>
              <span className="font-semibold text-green-700">Connected ✓</span>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 shrink-0" />
            <span className="text-sm text-gray-600">
              I understand the {feePercent}% platform fee will be deducted from each customer order automatically via Stripe. There is no monthly charge.
            </span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary text-sm px-4">← Back</button>
            <button
              onClick={activatePayg}
              disabled={!agreed || activating}
              className="btn-primary text-sm flex-1 disabled:opacity-40"
            >
              {activating ? 'Activating…' : 'Activate Pay As You Go'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 (Subscription): Payment setup ────────────── */}
      {step === 2 && !isPayg && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-800">Set up subscription payment</h2>
          <p className="text-sm text-gray-500">
            Choose how you&apos;ll pay your{' '}
            <strong>
              £{billingPeriod === 'monthly' ? `${monthlyPrice.toFixed(2)}/month`
                : hasBothPeriods ? `${annualPrice.toFixed(2)}/year` : monthlyPrice.toFixed(2)}
            </strong>{' '}
            subscription to Eventifood.
          </p>

          <div className="space-y-2">
            <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <input type="radio" name="method" checked={paymentMethod === 'paypal'} onChange={() => { setPaymentMethod('paypal'); setError(null) }} className="mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 text-sm">PayPal recurring billing</p>
                <p className="text-xs text-gray-500 mt-0.5">Authorise a recurring PayPal payment — you approve it once and PayPal handles future charges automatically.</p>
                {paymentStatus?.paypal_onboarding_complete && (
                  <p className="text-xs text-green-600 mt-1 font-medium">Previously configured ✓</p>
                )}
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'gocardless' ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <input type="radio" name="method" checked={paymentMethod === 'gocardless'} onChange={() => { setPaymentMethod('gocardless'); setError(null) }} className="mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Direct Debit via GoCardless</p>
                <p className="text-xs text-gray-500 mt-0.5">Set up a Direct Debit from your UK bank account. Payments collected automatically on your billing date.</p>
                {paymentStatus?.gocardless_enabled && (
                  <p className="text-xs text-green-600 mt-1 font-medium">Previously configured ✓</p>
                )}
              </div>
            </label>
          </div>

          {paymentMethod === 'paypal' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 space-y-1.5">
              <p className="font-semibold">How PayPal subscription billing works</p>
              <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                <li>You&apos;ll be redirected to PayPal to authorise the subscription</li>
                <li>PayPal will charge you automatically each {billingPeriod === 'monthly' ? 'month' : 'year'}</li>
                <li>You can cancel at any time from your PayPal account</li>
                <li>This is separate from how your own customers pay you</li>
              </ul>
            </div>
          )}

          {paymentMethod === 'gocardless' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 space-y-1.5">
              <p className="font-semibold">What you&apos;ll need</p>
              <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                <li>A UK bank account sort code and account number</li>
                <li>You&apos;ll set up a Direct Debit mandate once</li>
                <li>Payments are then collected automatically</li>
              </ul>
            </div>
          )}

          {!paymentMethod && error && <p className="text-sm text-red-500">{error}</p>}
          {error && paymentMethod && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary text-sm px-4">← Back</button>

            {paymentMethod === 'paypal' && (
              <button
                onClick={redirectToPayPal}
                disabled={paypalRedirecting}
                className="btn-primary text-sm flex-1 disabled:opacity-40"
              >
                {paypalRedirecting ? 'Redirecting to PayPal…' : `Authorise with PayPal →`}
              </button>
            )}

            {paymentMethod === 'gocardless' && (
              <button
                onClick={redirectToGoCardless}
                disabled={gcRedirecting}
                className="btn-primary text-sm flex-1 disabled:opacity-40"
              >
                {gcRedirecting ? 'Redirecting to GoCardless…' : 'Set up Direct Debit →'}
              </button>
            )}

            {!paymentMethod && (
              <button
                onClick={() => setError('Please choose a payment method.')}
                className="btn-primary text-sm flex-1 opacity-50"
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
