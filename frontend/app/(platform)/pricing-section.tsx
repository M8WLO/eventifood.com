'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Plan {
  id: number
  name: string
  slug: string
  monthly_price: string
  platform_fee_percent: string
  description: string
  features: string[]
  feature_flags: string[]
  is_highlighted: boolean
  display_order: number
}

// Core features included in every plan
const BASE_FEATURES = [
  'Your own ordering page (yourname.eventifood.com)',
  'QR code to print and display at your van',
  'Live kitchen board',
  'Menu management',
  'Email order confirmations',
  '2% per transaction — nothing when not trading',
]

// Human-readable labels for feature_flags keys
const FLAG_LABELS: Record<string, string> = {
  inventory:   'Inventory management',
  wastage:     'Wastage tracking',
  print_menus: 'Print menu PDFs',
  events:      'Event pricing presets',
  analytics:   'Sales analytics & P&L',
  wait_time:   'Live wait time display',
  staff:       'Staff cost tracking',
  sms:         'SMS order notifications',
}

function planExtras(plan: Plan): string[] {
  const fromFlags = (plan.feature_flags || [])
    .map((f) => FLAG_LABELS[f])
    .filter(Boolean) as string[]
  const manual = (plan.features || []).filter(
    (f) => !fromFlags.includes(f) && !BASE_FEATURES.includes(f)
  )
  return [...fromFlags, ...manual]
}

const FALLBACK_PLANS: Plan[] = [
  {
    id: 0, name: 'Starter', slug: 'starter', monthly_price: '0',
    platform_fee_percent: '2.00', description: 'Core ordering — free to use',
    features: [], feature_flags: [], is_highlighted: false, display_order: 0,
  },
  {
    id: 1, name: 'Trader', slug: 'trader', monthly_price: '0',
    platform_fee_percent: '2.00', description: 'Everything you need to trade',
    features: [], feature_flags: ['inventory', 'wastage', 'print_menus', 'wait_time'],
    is_highlighted: true, display_order: 1,
  },
  {
    id: 2, name: 'Pro', slug: 'pro', monthly_price: '0',
    platform_fee_percent: '2.00', description: 'Full platform for serious sellers',
    features: [], feature_flags: ['inventory', 'wastage', 'print_menus', 'wait_time', 'events', 'analytics', 'staff'],
    is_highlighted: false, display_order: 2,
  },
]

export default function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscriptions/plans/')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setPlans(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-7 h-96 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 items-start">
      {plans.map((plan) => {
        const extras = planExtras(plan)
        return (
          <div
            key={plan.id}
            className={`rounded-2xl border p-7 flex flex-col ${
              plan.is_highlighted
                ? 'border-brand-500 bg-brand-600 text-white shadow-2xl shadow-brand-200 md:-mt-4'
                : 'border-gray-200 bg-white'
            }`}
          >
            {plan.is_highlighted && (
              <span className="self-start bg-gold-400 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                Most popular
              </span>
            )}
            <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${plan.is_highlighted ? 'text-brand-200' : 'text-brand-500'}`}>
              {plan.name}
            </p>
            <div className="flex items-end gap-1 mb-1">
              <span className={`text-4xl font-extrabold ${plan.is_highlighted ? 'text-white' : 'text-gray-900'}`}>
                {Number(plan.monthly_price) === 0 ? 'Free' : `£${Number(plan.monthly_price).toFixed(0)}/mo`}
              </span>
            </div>
            <p className={`text-sm mb-2 ${plan.is_highlighted ? 'text-brand-200' : 'text-gray-500'}`}>
              {Number(plan.platform_fee_percent).toFixed(1)}% per transaction
            </p>
            <p className={`text-sm mb-5 ${plan.is_highlighted ? 'text-brand-100' : 'text-gray-500'}`}>
              {plan.description}
            </p>

            <div className="flex-1 mb-8">
              <ul className="space-y-2.5">
                {BASE_FEATURES.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${plan.is_highlighted ? 'text-brand-100' : 'text-gray-600'}`}>
                    <span className={`mt-0.5 flex-shrink-0 font-bold ${plan.is_highlighted ? 'text-brand-300' : 'text-brand-500'}`}>✓</span>
                    {f}
                  </li>
                ))}
                {extras.length > 0 && (
                  <>
                    <li className={`pt-1 pb-0.5 text-xs font-semibold uppercase tracking-wide ${plan.is_highlighted ? 'text-brand-300' : 'text-gray-400'}`}>
                      Also includes
                    </li>
                    {extras.map((f) => (
                      <li key={f} className={`flex items-start gap-2 text-sm ${plan.is_highlighted ? 'text-brand-100' : 'text-gray-600'}`}>
                        <span className={`mt-0.5 flex-shrink-0 font-bold ${plan.is_highlighted ? 'text-gold-300' : 'text-brand-500'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>

            <Link
              href="/register"
              className={`block text-center font-bold py-3 rounded-xl transition-all ${
                plan.is_highlighted
                  ? 'bg-gold-400 hover:bg-gold-500 text-white shadow-lg'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              Get started free
            </Link>
          </div>
        )
      })}
    </div>
  )
}
