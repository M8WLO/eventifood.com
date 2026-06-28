'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface DiscountCode {
  id: number
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  max_uses: number | null
  times_used: number
  created_at: string
}

const EMPTY_FORM = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  valid_from: '',
  valid_until: '',
  is_active: true,
  max_uses: '',
}

const MAX_CODES = 20

function isExpired(code: DiscountCode): boolean {
  if (!code.valid_until) return false
  return new Date(code.valid_until) < new Date(new Date().toDateString())
}

function isNotYetValid(code: DiscountCode): boolean {
  if (!code.valid_from) return false
  return new Date(code.valid_from) > new Date(new Date().toDateString())
}

function CodeStatus({ code }: { code: DiscountCode }) {
  if (!code.is_active) return <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Disabled</span>
  if (isExpired(code)) return <span className="text-xs font-medium px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Expired</span>
  if (isNotYetValid(code)) return <span className="text-xs font-medium px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full">Scheduled</span>
  if (code.max_uses !== null && code.times_used >= code.max_uses) return <span className="text-xs font-medium px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full">Used up</span>
  return <span className="text-xs font-medium px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Active</span>
}

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = () => {
    api.get('/api/discounts/')
      .then((r) => setCodes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (code: DiscountCode) => {
    setForm({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      valid_from: code.valid_from || '',
      valid_until: code.valid_until || '',
      is_active: code.is_active,
      max_uses: code.max_uses !== null ? String(code.max_uses) : '',
    })
    setEditingId(code.id)
    setError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }

  const save = async () => {
    setError(null)
    setSaving(true)
    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      is_active: form.is_active,
      max_uses: form.max_uses === '' ? null : Number(form.max_uses),
    }
    try {
      if (editingId !== null) {
        await api.patch(`/api/discounts/${editingId}/`, payload)
      } else {
        await api.post('/api/discounts/', payload)
      }
      closeForm()
      load()
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      if (data && typeof data === 'object') {
        const first = Object.values(data)[0]
        setError(Array.isArray(first) ? first[0] : String(first))
      } else {
        setError('Failed to save. Please check your inputs.')
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteCode = async (id: number) => {
    if (!confirm('Delete this discount code? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await api.delete(`/api/discounts/${id}/`)
      load()
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  const toggleActive = async (code: DiscountCode) => {
    try {
      await api.patch(`/api/discounts/${code.id}/`, { is_active: !code.is_active })
      load()
    } catch {
      // ignore
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>

  const canAddMore = codes.length < MAX_CODES

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create codes your customers can enter at checkout for a discount.
            {codes.length > 0 && (
              <span className="ml-2 text-gray-400">{codes.length} / {MAX_CODES} codes used</span>
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          disabled={!canAddMore}
          className="btn-primary text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + New code
        </button>
      </div>

      {!canAddMore && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          You have reached the limit of {MAX_CODES} discount codes. Delete an existing code to create a new one.
        </div>
      )}

      {codes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="font-semibold text-gray-700">No discount codes yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first code to offer discounts to customers.</p>
          <button onClick={openNew} className="btn-primary text-sm mt-4">Create first code</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Discount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Valid dates</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Uses</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-gray-900 tracking-wide">{code.code}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {code.discount_type === 'percentage'
                      ? `${Number(code.discount_value).toFixed(0)}% off`
                      : `£${Number(code.discount_value).toFixed(2)} off`}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {code.valid_from || code.valid_until ? (
                      <>
                        {code.valid_from ? new Date(code.valid_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Any time'}
                        {' → '}
                        {code.valid_until ? new Date(code.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry'}
                      </>
                    ) : (
                      <span className="text-gray-400">No date limit</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {code.times_used}{code.max_uses !== null ? ` / ${code.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <CodeStatus code={code} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => toggleActive(code)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                        {code.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => openEdit(code)} className="text-xs text-brand-600 hover:underline font-medium">Edit</button>
                      <button onClick={() => deleteCode(code.id)} disabled={deletingId === code.id} className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50">
                        {deletingId === code.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId !== null ? 'Edit discount code' : 'New discount code'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="input-field font-mono tracking-widest uppercase"
                  placeholder="e.g. SUMMER10"
                  maxLength={50}
                />
                <p className="text-xs text-gray-400 mt-1">Customers type this exactly at checkout. Automatically uppercased.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'percentage', label: '% off', sub: 'e.g. 10% off the total' },
                    { value: 'fixed', label: '£ off', sub: 'e.g. £5 off the total' },
                  ].map(({ value, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, discount_type: value as 'percentage' | 'fixed' }))}
                      className={`text-left rounded-xl border-2 px-4 py-3 transition-all ${form.discount_type === value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="font-semibold text-sm text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.discount_type === 'percentage' ? 'Percentage off' : 'Amount off (£)'}
                </label>
                <div className="relative">
                  {form.discount_type === 'fixed' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">£</span>
                  )}
                  <input
                    type="number"
                    step={form.discount_type === 'percentage' ? '1' : '0.01'}
                    min="0.01"
                    max={form.discount_type === 'percentage' ? '100' : undefined}
                    value={form.discount_value}
                    onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                    className={`input-field ${form.discount_type === 'fixed' ? 'pl-7' : ''}`}
                    placeholder={form.discount_type === 'percentage' ? '10' : '5.00'}
                  />
                  {form.discount_type === 'percentage' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid from <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid until <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">Leave blank for no date restriction.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max uses <span className="text-gray-400 font-normal">(optional — blank = unlimited)</span></label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))}
                  className="input-field"
                  placeholder="Unlimited"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-brand-600' : 'bg-gray-200'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {form.is_active ? 'Active — customers can use this code' : 'Disabled'}
                </span>
              </label>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={closeForm} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm px-4 py-2">
                {saving ? 'Saving…' : editingId !== null ? 'Save changes' : 'Create code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
