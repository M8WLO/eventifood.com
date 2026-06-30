'use client'

import { useState, useCallback } from 'react'
import api from '@/lib/api'

interface Snapshot {
  id: number
  name: string
  notes: string
  created_at: string
  created_by_email: string | null
}

interface TenantData {
  tenant_slug: string
  tenant_name: string
  snapshots: Snapshot[]
}

const SLUG_SEP = ' — '

export default function SnapshotsPage() {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantData, setTenantData] = useState<TenantData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const slugPrefix = (slug: string) => `${slug}${SLUG_SEP}`

  const loadSnapshots = useCallback(async (slug: string) => {
    if (!slug.trim()) return
    setLoading(true)
    setError('')
    setTenantData(null)
    try {
      const r = await api.get(`/api/snapshots/${slug}/`)
      setTenantData(r.data)
      setNewName(slugPrefix(slug))
    } catch (e: unknown) {
      const is404 = (e as { response?: { status?: number } })?.response?.status === 404
      setError(is404 ? `Tenant "${slug}" not found` : 'Failed to load snapshots')
    } finally {
      setLoading(false)
    }
  }, [])

  const createSnapshot = async () => {
    const name = newName.trim()
    if (!name || name === slugPrefix(tenantSlug)) return
    setCreating(true)
    setError('')
    try {
      await api.post(`/api/snapshots/${tenantSlug}/`, { name, notes: newNotes.trim() })
      setNewName(slugPrefix(tenantSlug))
      setNewNotes('')
      const r = await api.get(`/api/snapshots/${tenantSlug}/`)
      setTenantData(r.data)
    } catch (e: unknown) {
      const is404 = (e as { response?: { status?: number } })?.response?.status === 404
      setError(is404 ? `Tenant "${tenantSlug}" not found` : 'Failed to create snapshot')
    } finally {
      setCreating(false)
    }
  }

  const restoreSnapshot = async (id: number) => {
    if (!confirm('This will DELETE all current catalog data and restore from this snapshot. Are you sure?')) return
    setRestoring(id)
    setError('')
    try {
      await api.post(`/api/snapshots/${tenantSlug}/${id}/restore/`)
      alert('Catalog restored successfully.')
    } catch {
      setError('Restore failed')
    } finally {
      setRestoring(null)
    }
  }

  const deleteSnapshot = async (id: number) => {
    if (!confirm('Delete this snapshot permanently?')) return
    setDeleting(id)
    try {
      await api.delete(`/api/snapshots/${tenantSlug}/${id}/`)
      setTenantData(d => d ? { ...d, snapshots: d.snapshots.filter(x => x.id !== id) } : d)
    } catch {
      setError('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const snapshots = tenantData?.snapshots ?? []
  const nameIsJustPrefix = newName.trim() === slugPrefix(tenantSlug) || newName.trim() === ''

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Catalog Snapshots</h1>
      <p className="text-gray-500 text-sm mb-8">
        Take point-in-time backups of a tenant&apos;s full catalog. Restore at any time — useful for resetting demo accounts.
      </p>

      {/* Tenant lookup */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tenant slug</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={tenantSlug}
            onChange={e => setTenantSlug(e.target.value.toLowerCase().trim())}
            onKeyDown={e => e.key === 'Enter' && loadSnapshots(tenantSlug)}
            placeholder="e.g. andys-burgers"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={() => loadSnapshots(tenantSlug)}
            disabled={loading || !tenantSlug.trim()}
            className="bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>
        {tenantData && (
          <p className="mt-2 text-xs text-green-700 font-medium">
            ✓ {tenantData.tenant_name} <span className="text-gray-400">({tenantData.tenant_slug})</span>
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{error}</div>
      )}

      {tenantData && (
        <>
          {/* Create new snapshot */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Take new snapshot — <span className="text-brand-600">{tenantData.tenant_name}</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <input
                  type="text"
                  value={newName}
                  onChange={e => {
                    const val = e.target.value
                    const prefix = slugPrefix(tenantSlug)
                    // prevent erasing the slug prefix
                    setNewName(val.startsWith(prefix) ? val : prefix)
                  }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">Slug is auto-tagged — add a description after it</p>
              </div>
              <input
                type="text"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              onClick={createSnapshot}
              disabled={creating || nameIsJustPrefix}
              className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              {creating ? 'Saving…' : '📸 Take snapshot'}
            </button>
          </div>

          {/* Snapshot list */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
              </h2>
            </div>
            {snapshots.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No snapshots yet for this tenant.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {snapshots.map(snap => (
                  <li key={snap.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{snap.name}</div>
                      {snap.notes && <div className="text-xs text-gray-500 mt-0.5">{snap.notes}</div>}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(snap.created_at).toLocaleString('en-GB')}
                        {snap.created_by_email ? ` · ${snap.created_by_email}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => restoreSnapshot(snap.id)}
                        disabled={restoring === snap.id}
                        className="bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-amber-100 disabled:opacity-40 transition-colors"
                      >
                        {restoring === snap.id ? 'Restoring…' : '↩ Restore'}
                      </button>
                      <button
                        onClick={() => deleteSnapshot(snap.id)}
                        disabled={deleting === snap.id}
                        className="bg-red-50 text-red-600 border border-red-200 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-red-100 disabled:opacity-40 transition-colors"
                      >
                        {deleting === snap.id ? '…' : '🗑 Delete'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}