'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Tenant {
  name: string
  slug: string
  theme: string
  is_active: boolean
  created_at: string
}

interface Subscription {
  plan: string
  status: string
  annual_cost: string
  next_billing_date: string | null
}

const SUB_STATUSES = ['trialing', 'active', 'cancelled', 'past_due']

export default function TenantDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [saving, setSaving] = useState(false)
  const [subStatus, setSubStatus] = useState('')

  useEffect(() => {
    // Set tenant slug to load this tenant's data
    api.defaults.headers.common['X-Tenant-Slug'] = slug
    api.get('/api/tenants/me/').then((r) => setTenant(r.data))
    api.get('/api/subscriptions/status/').then((r) => {
      setSubscription(r.data)
      setSubStatus(r.data.status)
    }).catch(() => {})
  }, [slug])

  const saveTenant = async (field: string, value: string | boolean) => {
    setSaving(true)
    try {
      const { data } = await api.patch('/api/tenants/me/', { [field]: value })
      setTenant(data)
    } finally {
      setSaving(false)
    }
  }

  if (!tenant) return <div className="p-8 text-gray-400">Loading…</div>

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/superadmin" className="text-brand-600 hover:underline text-sm">← All tenants</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
      <p className="text-gray-400 text-sm">Slug: {tenant.slug} · Created: {new Date(tenant.created_at).toLocaleDateString()}</p>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Store settings</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Active</span>
          <button
            onClick={() => saveTenant('is_active', !tenant.is_active)}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
          >
            {tenant.is_active ? 'Active (click to deactivate)' : 'Inactive (click to activate)'}
          </button>
        </div>
        <div>
          <a href={`https://${tenant.slug}.eventifood.com`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm">
            View store →
          </a>
        </div>
      </div>

      {subscription && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700">Subscription override</h2>
          <div className="flex items-center gap-3">
            <select
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
              className="input-field w-48"
            >
              {SUB_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={async () => {
                setSaving(true)
                try {
                  await api.patch('/api/subscriptions/status/', { status: subStatus })
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving}
              className="btn-primary text-sm py-1 px-3"
            >
              Save
            </button>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <div>Plan: <span className="font-medium">{subscription.plan}</span></div>
            <div>Annual cost: <span className="font-medium">£{subscription.annual_cost}</span></div>
            {subscription.next_billing_date && <div>Next billing: {subscription.next_billing_date}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
