'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Tooltip } from '@/components/Tooltip'

interface PaymentStatus {
  sandbox_mode: boolean
  payment_mode: 'payg' | 'own'
  stripe_onboarding_complete: boolean
  stripe_account_id: string
  paypal_merchant_id: string
  paypal_onboarding_complete: boolean
  gocardless_enabled: boolean
  gocardless_has_token: boolean
}

interface Plan {
  id: number
  name: string
  description: string
  features: string[]
  monthly_price: string
  annual_price: string
  platform_fee_percent: string
  billing_model: string
  is_highlighted: boolean
}

interface TenantPlanData {
  plan: Plan | null
  can_change: boolean
  days_until_change: number
  next_change_allowed_at: string | null
  subscription_next_billing_date: string | null
  subscription_billing_cycle: string | null
}

function planPriceLine(plan: Plan): string {
  if (plan.billing_model === 'payg') {
    return `${Number(plan.platform_fee_percent).toFixed(1)}% per transaction · no monthly charge`
  }
  const monthly = Number(plan.monthly_price)
  const annual = Number(plan.annual_price)
  if (monthly > 0 && annual > 0) return `£${monthly.toFixed(2)}/mo · £${annual.toFixed(2)}/yr`
  if (monthly > 0) return `£${monthly.toFixed(2)}/month`
  if (annual > 0) return `£${annual.toFixed(2)}/year`
  return 'Contact us for pricing'
}

function StatusBadge({ ok, partial, label }: { ok: boolean; partial?: boolean; label: string }) {
  if (ok) return <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full">{label}</span>
  if (partial) return <span className="text-xs font-semibold px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full">{label}</span>
  return <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-full">{label}</span>
}

export default function PlansPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [tenantPlan, setTenantPlan] = useState<TenantPlanData | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [stripeModal, setStripeModal] = useState<{ planId: number; planName: string } | null>(null)

  const switchedParam = searchParams.get('switched')
  const paypalSuccess = searchParams.get('paypal_success')
  const paypalPending = searchParams.get('paypal_pending')
  const paypalError = searchParams.get('paypal_error')

  useEffect(() => {
    Promise.all([
      api.get('/api/payments/status/'),
      api.get('/api/subscriptions/my-plan/').catch(() => ({ data: null })),
      api.get('/api/subscriptions/plans/').catch(() => ({ data: [] })),
    ]).then(([statusRes, planRes, plansRes]) => {
      setStatus(statusRes.data)
      if (planRes.data) setTenantPlan(planRes.data)
      setPlans(plansRes.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!status) return <div className="p-8 text-red-500">Failed to load plans.</div>

  const isPayg = status.payment_mode === 'payg'

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your Eventifood subscription plan and how your monthly fee is collected.
        </p>
      </div>

      {/* Sandbox banner */}
      {status.sandbox_mode && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <span className="text-2xl shrink-0">🧪</span>
          <div>
            <p className="font-bold text-amber-900 text-sm">Test / sandbox mode active</p>
            <p className="text-xs text-amber-700 mt-0.5">All payments are using test credentials — no real money will move.</p>
          </div>
        </div>
      )}

      {/* Plan switch / PayPal return banners */}
      {(switchedParam || paypalSuccess || paypalPending || paypalError) && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-start gap-3 ${
          paypalError ? 'bg-red-50 border border-red-200 text-red-800'
          : paypalPending ? 'bg-amber-50 border border-amber-200 text-amber-800'
          : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <span className="text-xl shrink-0">
            {paypalError ? '❌' : paypalPending ? '⏳' : '✅'}
          </span>
          <div>
            {paypalError && <p className="font-semibold">PayPal error — {paypalError}</p>}
            {paypalPending && (
              <>
                <p className="font-semibold">PayPal authorisation pending</p>
                <p className="text-xs mt-0.5">PayPal will confirm the subscription shortly. Your plan will activate automatically.</p>
              </>
            )}
            {(paypalSuccess || switchedParam) && (
              <>
                <p className="font-semibold">Plan activated successfully</p>
                <p className="text-xs mt-0.5">Your plan is now active.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Current plan + plan list */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Your plan</h2>

        <div className="bg-brand-50 rounded-xl px-4 py-3 text-sm">
          {tenantPlan?.plan ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-brand-800">{tenantPlan.plan.name}</span>
                <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
              </div>
              <p className="text-xs text-brand-600">{tenantPlan.plan.description}</p>
              <p className="text-xs text-brand-600 mt-0.5">{planPriceLine(tenantPlan.plan)}</p>
              {tenantPlan.plan.features?.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {tenantPlan.plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-brand-700 flex items-center gap-1">
                      <span className="text-green-500">✓</span>{f}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-brand-800">No plan selected</p>
              <p className="text-xs text-brand-600 mt-0.5">Choose a plan below to get started.</p>
            </>
          )}
        </div>

        {tenantPlan && !tenantPlan.can_change && tenantPlan.days_until_change > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <span className="shrink-0">Plan can be changed in <span className="font-semibold">{tenantPlan.days_until_change} day{tenantPlan.days_until_change !== 1 ? 's' : ''}</span>. Plans are locked for 30 days after a change.</span>
            <Tooltip text="The 30-day lock prevents accidental plan-hopping. It applies to seller-initiated changes only — a superadmin can override it if needed." />
          </div>
        )}

        {plans.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {tenantPlan?.plan ? 'Switch plan' : 'Choose a plan'}
            </h3>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-800">
              <span className="font-semibold">⚠ 30-day lock:</span>{' '}
              {tenantPlan?.plan
                ? 'Once you switch to a new plan, you will not be able to change it again for 30 days.'
                : 'Once you select a plan, you will not be able to change it for 30 days.'}
            </div>

            <div className="space-y-2">
              {plans.map((plan) => {
                const isCurrent = tenantPlan?.plan?.id === plan.id
                const hasAnyPlan = !!tenantPlan?.plan
                const canAct = tenantPlan?.can_change !== false && !isCurrent
                const isAnnualPlan = plan.billing_model !== 'payg' && Number(plan.annual_price) > 0
                const currentIsAnnual = hasAnyPlan && tenantPlan?.subscription_billing_cycle === 'annual'
                const nextBillingDate = tenantPlan?.subscription_next_billing_date
                  ? new Date(tenantPlan.subscription_next_billing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : null

                let annualNote: string | null = null
                if (!isCurrent && isAnnualPlan) {
                  if (!hasAnyPlan) {
                    annualNote = 'Annual commitment — this plan runs for 12 months from the date you activate it.'
                  } else if (currentIsAnnual && nextBillingDate) {
                    annualNote = `Annual switch — this will not take effect until your current annual plan expires on ${nextBillingDate}.`
                  } else if (currentIsAnnual) {
                    annualNote = 'Annual switch — this will not take effect until your current annual plan expires.'
                  }
                }
                if (!isCurrent && !isAnnualPlan && currentIsAnnual && nextBillingDate) {
                  annualNote = `Switch will not take effect until your current annual plan expires on ${nextBillingDate}.`
                }

                return (
                  <div
                    key={plan.id}
                    className={`p-3 rounded-xl border-2 ${isCurrent ? 'border-brand-500 bg-brand-50' : 'border-gray-100'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
                          {isCurrent && <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">Current</span>}
                          {plan.is_highlighted && !isCurrent && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Popular</span>}
                        </div>
                        {plan.description && <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">{planPriceLine(plan)}</p>
                        {annualNote && (
                          <p className="text-xs text-amber-700 mt-1 italic">{annualNote}</p>
                        )}
                      </div>
                      {!isCurrent && (
                        canAct ? (
                          plan.billing_model === 'payg' && !status?.stripe_onboarding_complete ? (
                            <button
                              onClick={() => setStripeModal({ planId: plan.id, planName: plan.name })}
                              className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                            >
                              {hasAnyPlan ? 'Switch →' : 'Select →'}
                            </button>
                          ) : (
                            <Link
                              href={`/seller/payment-portal/switch/${plan.id}`}
                              className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                            >
                              {hasAnyPlan ? 'Switch →' : 'Select →'}
                            </Link>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 shrink-0 mt-1">Locked</span>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Subscription billing — how the seller pays their Eventifood fee */}
      {!isPayg && tenantPlan?.plan && (
        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700">Subscription billing</h2>
            <p className="text-sm text-gray-500 mt-1">
              How your Eventifood subscription fee is collected each billing period. Set up at least one method to keep your plan active.
            </p>
          </div>

          {!status.paypal_onboarding_complete && !status.gocardless_enabled && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <p className="text-sm text-amber-800">
                No billing method set up. Add GoCardless Direct Debit or PayPal so your <strong>{tenantPlan.plan.name}</strong> plan stays active.
              </p>
            </div>
          )}

          {/* GoCardless Direct Debit */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1d3557] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">GC</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">GoCardless Direct Debit</p>
                <p className="text-sm text-gray-500">Pay your subscription automatically via bank Direct Debit — no card needed.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge
                ok={status.gocardless_enabled}
                partial={status.gocardless_has_token && !status.gocardless_enabled}
                label={status.gocardless_enabled ? 'Active' : status.gocardless_has_token ? 'Saved' : 'Not set up'}
              />
              <div className="flex flex-col items-end gap-0.5">
                <Link href="/seller/payment-portal/gocardless" className="btn-secondary text-sm">Configure</Link>
                {!status.gocardless_enabled && <span className="text-xs text-gray-400">~10 min</span>}
              </div>
            </div>
          </div>

          {/* PayPal */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">PP</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">PayPal</p>
                <p className="text-sm text-gray-500">Pay your Eventifood subscription via PayPal.</p>
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
        </div>
      )}

      {/* Stripe required modal for PAYG plan selection */}
      {stripeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#635bff] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Stripe setup required</h2>
                <p className="text-sm text-gray-500 mt-0.5">{stripeModal.planName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Pay As You Go plans use <strong>Stripe Connect</strong> to process customer payments. The platform
              automatically collects its fee from each transaction, so your Stripe account must be connected
              before you can activate a PAYG plan.
            </p>
            <p className="text-sm text-gray-700">
              Setup takes around <strong>5 minutes</strong>. Once connected, come back here to select your plan.
            </p>
            <div className="flex gap-3 pt-1">
              <Link
                href="/seller/payments"
                className="btn-primary flex-1 text-center text-sm"
                onClick={() => setStripeModal(null)}
              >
                Set up Stripe →
              </Link>
              <button
                onClick={() => setStripeModal(null)}
                className="btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
