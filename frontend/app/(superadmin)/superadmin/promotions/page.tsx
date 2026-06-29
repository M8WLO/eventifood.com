'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Promotion {
  id: number
  name: string
  banner_headline: string
  banner_subtext: string
  banner_cta: string
  start_date: string
  end_date: string
  trial_until: string
  is_active: boolean
  created_at: string
}

const JULY_DEFAULTS = {
  name: 'July 2026 Giveaway',
  banner_headline: 'July Giveaway — 3 months completely free.',
  banner_subtext: 'Register in July, trade free until 1st October. No card. No catch. Our gift to you.',
  banner_cta: 'Claim free months →',
  start_date: '2026-07-01',
  end_date: '2026-07-31',
  trial_until: '2026-10-01',
  is_active: true,
}

const EMPTY_FORM = {
  name: '',
  banner_headline: '',
  banner_subtext: '',
  banner_cta: 'Claim free months →',
  start_date: '',
  end_date: '',
  trial_until: '',
  is_active: true,
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...JULY_DEFAULTS })
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/api/tenants/promotions/')
      setPromos(res.data)
    } catch {
      setError('Failed to load promotions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditId(null)
    setForm({ ...JULY_DEFAULTS })
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function openEdit(p: Promotion) {
    setEditId(p.id)
    setForm({
      name: p.name,
      banner_headline: p.banner_headline,
      banner_subtext: p.banner_subtext,
      banner_cta: p.banner_cta,
      start_date: p.start_date,
      end_date: p.end_date,
      trial_until: p.trial_until,
      is_active: p.is_active,
    })
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditId(null)
    setError('')
  }

  async function save() {
    setError('')
    setSaving(true)
    try {
      if (editId) {
        await api.patch(`/api/tenants/promotions/${editId}/`, form)
        setSuccess('Promotion updated.')
      } else {
        await api.post('/api/tenants/promotions/', form)
        setSuccess('Promotion created.')
      }
      setShowForm(false)
      setEditId(null)
      load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } }
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        setError(Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | '))
      } else {
        setError('Save failed. Check all fields are filled.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: Promotion) {
    try {
      await api.patch(`/api/tenants/promotions/${p.id}/`, { is_active: !p.is_active })
      load()
    } catch {
      setError('Failed to update promotion.')
    }
  }

  async function deletePromo(p: Promotion) {
    if (!confirm(`Delete promotion "${p.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/tenants/promotions/${p.id}/`)
      load()
    } catch {
      setError('Failed to delete promotion.')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  function statusBadge(p: Promotion) {
    if (!p.is_active) return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">Inactive</span>
    if (p.end_date < today) return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">Expired</span>
    if (p.start_date > today) return <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">Scheduled</span>
    return <span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 font-semibold">Live</span>
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Control hero banner content and auto-grant free trials during promotional windows.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New promotion
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3">
          {success}
        </div>
      )}
      {error && !showForm && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Banner preview */}
      {promos.some(p => p.is_active && p.start_date <= today && p.end_date >= today) && (() => {
        const live = promos.find(p => p.is_active && p.start_date <= today && p.end_date >= today)!
        return (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Live banner preview</p>
            <div className="relative bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-900 rounded-xl overflow-hidden">
              <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
                <span className="text-xl">🎉</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight">{live.banner_headline}</span>
                  <span className="text-xs sm:text-sm text-amber-900 font-medium">{live.banner_subtext}</span>
                </div>
                <span className="shrink-0 bg-gray-900 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg shadow-sm">
                  {live.banner_cta}
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editId ? 'Edit promotion' : 'Create promotion'}
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Promotion name (internal)</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. July 2026 Giveaway"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Banner headline</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.banner_headline}
                onChange={e => setForm(f => ({ ...f, banner_headline: e.target.value }))}
                placeholder="July Giveaway — 3 months completely free."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Banner subtext</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.banner_subtext}
                onChange={e => setForm(f => ({ ...f, banner_subtext: e.target.value }))}
                placeholder="Register in July, trade free until 1st October. No card. No catch."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CTA button text</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.banner_cta}
                onChange={e => setForm(f => ({ ...f, banner_cta: e.target.value }))}
                placeholder="Claim free months →"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Free trial until</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.trial_until}
                onChange={e => setForm(f => ({ ...f, trial_until: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Registrations during the window get trial_expires_at set to this date.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Promotion start date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Banner shown + trial granted from this date.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Promotion end date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Banner hidden + trial no longer auto-granted after this date.</p>
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-amber-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Active — only one active promotion runs at a time (first match by date wins)
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={save}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Create promotion'}
            </button>
            <button
              onClick={cancel}
              className="text-gray-600 hover:text-gray-900 text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            {!editId && (
              <button
                onClick={() => setForm({ ...EMPTY_FORM })}
                className="text-gray-500 hover:text-gray-700 text-xs px-3 py-2 rounded-lg transition-colors ml-auto"
              >
                Clear form
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : promos.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl py-12 text-center">
          <p className="text-gray-500 text-sm mb-1">No promotions yet.</p>
          <p className="text-gray-400 text-xs">Create one above to start the July giveaway.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Window</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trial until</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400 truncate max-w-xs">{p.banner_headline}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {p.start_date} → {p.end_date}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.trial_until}</td>
                  <td className="px-4 py-3">{statusBadge(p)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleActive(p)}
                        className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-100 hover:border-blue-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePromo(p)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-100 hover:border-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">How promotions work</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
          <li>The hero page banner is shown automatically when a promotion is active today (start date ≤ today ≤ end date).</li>
          <li>New registrations that verify their email during the window receive <code className="bg-amber-100 px-1 rounded">trial_expires_at</code> set to the <strong>Trial until</strong> date — free trading, no card required.</li>
          <li>Only the first matching active promotion runs (ordered by start date descending).</li>
          <li>Deactivate a promotion to suppress the banner immediately without deleting it.</li>
        </ul>
      </div>
    </div>
  )
}
