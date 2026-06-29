import Link from 'next/link'

export interface Plan {
  id: number
  name: string
  slug: string
  billing_model: string
  monthly_price: string
  annual_price?: string
  platform_fee_percent: string
  description: string
  features: string[]
  feature_flags: string[]
  is_highlighted: boolean
  display_order: number
}

const BASE_FEATURES = [
  'Your own ordering page (yourname.eventifood.com)',
  'QR code to print and display at your van',
  'Live kitchen board',
  'Menu management',
  'Email order confirmations',
]

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

function priceLabel(plan: Plan): string {
  const price = Number(plan.monthly_price)
  if (plan.billing_model === 'payg') {
    const fee = Number(plan.platform_fee_percent)
    return `${fee % 1 === 0 ? fee.toFixed(0) : fee.toFixed(1)}%/order`
  }
  if (price === 0) return 'Free'
  return `£${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}/mo`
}

function ctaLabel(plan: Plan): string {
  const price = Number(plan.monthly_price)
  if (plan.billing_model === 'payg' || price === 0) return 'Get started free'
  return 'Get started'
}

export default function PricingSection({ plans }: { plans: Plan[] }) {
  return (
    <>
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
                  {priceLabel(plan)}
                </span>
              </div>
              {plan.billing_model === 'payg' ? (
                <p className={`text-sm mb-2 ${plan.is_highlighted ? 'text-brand-200' : 'text-gray-500'}`}>
                  £0/month · {Number(plan.platform_fee_percent).toFixed(1)}% platform fee + Stripe processing
                </p>
              ) : (
                <p className={`text-sm mb-2 ${plan.is_highlighted ? 'text-brand-200' : 'text-gray-500'}`}>
                  No per-transaction fee
                </p>
              )}
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
                  {plan.billing_model === 'payg' && (
                    <li className={`flex items-start gap-2 text-sm ${plan.is_highlighted ? 'text-brand-100' : 'text-gray-600'}`}>
                      <span className={`mt-0.5 flex-shrink-0 font-bold ${plan.is_highlighted ? 'text-brand-300' : 'text-brand-500'}`}>✓</span>
                      {Number(plan.platform_fee_percent).toFixed(1)}% platform fee per order + Stripe card processing (~1.5% + 20p) — £0 when not trading
                    </li>
                  )}
                  {extras.length > 0 && (
                    <>
                      <li className={`pt-1 pb-0.5 text-xs font-semibold uppercase tracking-wide ${plan.is_highlighted ? 'text-brand-300' : 'text-gray-400'}`}>
                        Also includes
                      </li>
                      {extras.map((f) => (
                        <li key={f} className={`flex items-start gap-2 text-sm ${plan.is_highlighted ? 'text-brand-100' : 'text-gray-600'}`}>
                          <span className={`mt-0.5 flex-shrink-0 font-bold ${plan.is_highlighted ? 'text-gold-300' : 'text-brand-500'}`}>✓</span>
                          {f} <span className={`text-xs font-semibold ${plan.is_highlighted ? 'text-gold-300' : 'text-brand-400'}`}>*</span>
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
                {ctaLabel(plan)}
              </Link>
            </div>
          )
        })}
      </div>
      <p className="mt-6 text-center text-xs text-gray-400">* Available on premium subscription tiers only.</p>
    </>
  )
}
