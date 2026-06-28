'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Tooltip } from '@/components/Tooltip'

interface PaymentStatus {
  payment_mode: 'payg' | 'own'
  stripe_account_id: string
  stripe_onboarding_complete: boolean
  connected_at: string | null
  paypal_merchant_id: string
  paypal_onboarding_complete: boolean
  sumup_merchant_code: string
  sumup_enabled: boolean
  sumup_has_key: boolean
  gocardless_enabled: boolean
  gocardless_has_token: boolean
}

interface Plan {
  id: number
  name: string
  description: string
  features: string[]
  monthly_price: string
  platform_fee_percent: string
  is_highlighted: boolean
}

interface TenantPlanData {
  plan: Plan | null
  can_change: boolean
  days_until_change: number
}

function StatusBadge({ ok, partial, label }: { ok: boolean; partial?: boolean; label: string }) {
  if (ok) return <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full">{label}</span>
  if (partial) return <span className="text-xs font-semibold px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full">{label}</span>
  return <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-full">{label}</span>
}

export default function PaymentPortalPage() {
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [tenantPlan, setTenantPlan] = useState<TenantPlanData | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [planSaving, setPlanSaving] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/payments/status/'),
      api.get('/api/subscriptions/my-plan/').catch(() => ({ data: null })),
      api.get('/api/subscriptions/plans/').catch(() => ({ data: [] })),
    ]).then(([statusRes, planRes, plansRes]) => {
      setStatus(statusRes.data)
      if (planRes.data) {
        setTenantPlan(planRes.data)
        setSelectedPlanId(planRes.data.plan?.id ?? null)
      }
      setPlans(plansRes.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const savePlan = async () => {
    if (!selectedPlanId) return
    setPlanSaving(true)
    try {
      const { data } = await api.post('/api/subscriptions/my-plan/', { plan_id: selectedPlanId })
      setTenantPlan(data)
      setPlanSaved(true)
      setTimeout(() => setPlanSaved(false), 3000)
    } finally {
      setPlanSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading payment portal…</div>
  if (!status) return <div className="p-8 text-red-500">Failed to load payment settings.</div>

  const isPayg = status.payment_mode === 'payg'

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Portal</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription plan and configure how you collect payments from customers.
        </p>
      </div>

      {/* ── Plan ─────────────────────────────────────────────────── */}
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
              <p className="text-xs text-brand-600 mt-0.5">
                {Number(tenantPlan.plan.platform_fee_percent).toFixed(1)}% per transaction · no monthly charge
              </p>
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
              <p className="text-xs text-brand-600 mt-0.5">Choose a plan below to unlock features.</p>
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Switch plan</h3>
            <div className="space-y-2">
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <input
                    type="radio"
                    name="plan"
                    checked={selectedPlanId === plan.id}
                    onChange={() => setSelectedPlanId(plan.id)}
                    className="mt-1"
                    disabled={!tenantPlan?.can_change}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
                      {plan.is_highlighted && (
                        <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">Popular</span>
                      )}
                    </div>
                    {plan.description && <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>}
                    <p className="text-xs text-gray-500 mt-0.5">{Number(plan.platform_fee_percent).toFixed(1)}% per transaction</p>
                    {plan.features?.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="text-green-500">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={savePlan}
              disabled={planSaving || selectedPlanId === tenantPlan?.plan?.id || !tenantPlan?.can_change}
              className="btn-primary mt-3 text-sm disabled:opacity-30"
            >
              {planSaving ? 'Saving…' : planSaved ? 'Saved ✓' : 'Switch plan'}
            </button>
          </div>
        )}
      </div>

      {/* ── Next step prompt after plan switch ──────────────────── */}
      {!isPayg && !status.stripe_onboarding_complete && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">👇</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">Next step: connect a payment method</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Your plan is active. To accept card payments from customers, connect Stripe below.
              You can also add SumUp, PayPal, or GoCardless.
            </p>
          </div>
        </div>
      )}

      {/* ── Stripe Connect ───────────────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Card payments — Stripe Connect</h2>
        {isPayg && (
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            On Pay As You Go, Stripe Connect is your payment method. The platform collects a 2% fee per order automatically.
          </p>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#635bff] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Stripe</p>
              <p className="text-sm text-gray-500">
                {status.stripe_onboarding_complete
                  ? 'Connected — accepting card payments'
                  : status.stripe_account_id
                  ? 'Account created — complete setup to go live'
                  : 'Not connected'}
              </p>
            </div>
          </div>
          <StatusBadge
            ok={status.stripe_onboarding_complete}
            partial={!!status.stripe_account_id && !status.stripe_onboarding_complete}
            label={status.stripe_onboarding_complete ? 'Connected' : status.stripe_account_id ? 'Incomplete' : 'Not set up'}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/seller/settings/payments/stripe" className="btn-primary text-sm inline-block">
            {status.stripe_onboarding_complete ? 'Manage Stripe →' : 'Set up Stripe →'}
          </Link>
          {!status.stripe_onboarding_complete && (
            <span className="text-xs text-gray-400">~5 min setup</span>
          )}
        </div>
      </div>

      {/* ── Alternative payment methods ──────────────────────────── */}
      {isPayg ? (
        <div className="card bg-gray-50 border border-gray-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h2 className="font-semibold text-gray-700">Additional payment methods</h2>
              <p className="text-sm text-gray-500 mt-1">
                PayPal, SumUp, and GoCardless are not available on the Pay As You Go plan.
                On PAYG, all card payments must go through the platform Stripe Connect so the platform fee is collected automatically.
              </p>
              <p className="text-xs text-gray-400 mt-2">Contact support if you need a custom payment arrangement.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">Additional payment methods</h2>
          <p className="text-sm text-gray-500">
            On your plan there is no platform commission. Configure whichever providers you want to offer customers —
            payments go directly to your accounts.
          </p>

          {/* PayPal */}
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003087] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">PP</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">PayPal</p>
                <p className="text-sm text-gray-500">Accept PayPal payments via PayPal Commerce Platform.</p>
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

          {/* SumUp */}
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">Su</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">SumUp</p>
                <p className="text-sm text-gray-500">Accept card payments online via your SumUp account.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge
                ok={status.sumup_enabled}
                partial={status.sumup_has_key && !status.sumup_enabled}
                label={status.sumup_enabled ? 'Enabled' : status.sumup_has_key ? 'Saved, not enabled' : 'Not set up'}
              />
              <div className="flex flex-col items-end gap-0.5">
                <Link href="/seller/payment-portal/sumup" className="btn-secondary text-sm">Configure</Link>
                {!status.sumup_enabled && <span className="text-xs text-gray-400">~10 min</span>}
              </div>
            </div>
          </div>

          {/* GoCardless */}
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1d3557] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">GC</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">GoCardless</p>
                <p className="text-sm text-gray-500">Collect Direct Debit payments via GoCardless.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge
                ok={status.gocardless_enabled}
                partial={status.gocardless_has_token && !status.gocardless_enabled}
                label={status.gocardless_enabled ? 'Enabled' : status.gocardless_has_token ? 'Saved, not enabled' : 'Not set up'}
              />
              <div className="flex flex-col items-end gap-0.5">
                <Link href="/seller/payment-portal/gocardless" className="btn-secondary text-sm">Configure</Link>
                {!status.gocardless_enabled && <span className="text-xs text-gray-400">~10 min</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
