'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

// ---- types ----
interface StaffEntry { name: string; hours: string; hourly_rate: string }
interface ItemOverride { type: 'product' | 'variation'; id: number; price_override: string }
interface PLSummary {
  order_count: number; revenue: number; cogs: number; gross_profit: number
  pitch_cost: number; pitch_percent: number; pitch_percent_cost: number
  staffing_cost: number; net_profit: number
}
interface Event {
  id: number; name: string; date: string; pitch_cost: string | null; pitch_percent: string | null
  staff_entries: StaffEntry[]; item_overrides: ItemOverride[]
  is_active: boolean; created_at: string
  total_staffing_cost: number; pl_summary: PLSummary
}
interface EventPreset {
  id: number; name: string; pitch_cost: string | null; pitch_percent: string | null
  staff_entries: StaffEntry[]; item_overrides: ItemOverride[]
}

// Catalog types for item picker
interface Variation { id: number; name: string; retail_price: string }
interface Product { id: number; name: string; base_price: string | null; has_variations: boolean; variations: Variation[] }
interface Category { id: number; name: string; products: Product[] }
interface GlobalExtra { id: number; name: string; price: string }

const EMPTY_STAFF: StaffEntry = { name: '', hours: '', hourly_rate: '' }

function fmt(n: number) {
  const abs = Math.abs(n)
  return (n < 0 ? '-' : '') + '£' + abs.toFixed(2)
}

function PLCard({ pl }: { pl: PLSummary }) {
  const profit = pl.net_profit
  return (
    <div className="mt-4 border-t border-gray-100 pt-4 space-y-1.5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">P&amp;L ({pl.order_count} orders)</p>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Revenue</span>
        <span className="font-semibold text-gray-900">{fmt(pl.revenue)}</span>
      </div>
      {pl.cogs > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Cost of goods</span>
          <span className="text-gray-700">−{fmt(pl.cogs)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm border-t border-gray-100 pt-1.5">
        <span className="text-gray-600">Gross profit</span>
        <span className={`font-semibold ${pl.gross_profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(pl.gross_profit)}</span>
      </div>
      {pl.pitch_cost > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Pitch cost</span>
          <span className="text-gray-700">−{fmt(pl.pitch_cost)}</span>
        </div>
      )}
      {pl.pitch_percent_cost > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Organiser commission ({pl.pitch_percent}%)</span>
          <span className="text-gray-700">−{fmt(pl.pitch_percent_cost)}</span>
        </div>
      )}
      {pl.staffing_cost > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Staffing</span>
          <span className="text-gray-700">−{fmt(pl.staffing_cost)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-1">
        <span className="font-bold text-gray-800">Net profit</span>
        <span className={`font-bold text-base ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(profit)}</span>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [presets, setPresets] = useState<EventPreset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [globalExtras, setGlobalExtras] = useState<GlobalExtra[]>([])
  const [editing, setEditing] = useState<Event | null>(null)
  const [activating, setActivating] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  // Preset save modal
  const [savePresetModal, setSavePresetModal] = useState<Event | null>(null)
  const [presetName, setPresetName] = useState('')
  const [savingPreset, setSavingPreset] = useState(false)
  const [deletingPreset, setDeletingPreset] = useState<number | null>(null)

  // Form state
  const [draftName, setDraftName] = useState('')
  const [draftDate, setDraftDate] = useState('')
  const [draftPitchCost, setDraftPitchCost] = useState('')
  const [draftPitchPercent, setDraftPitchPercent] = useState('')
  const [draftStaff, setDraftStaff] = useState<StaffEntry[]>([{ ...EMPTY_STAFF }])
  const [draftItems, setDraftItems] = useState<ItemOverride[]>([])

  const load = useCallback(() => {
    api.get('/api/events/').then((r) => setEvents(r.data)).catch(() => {})
    api.get('/api/events/presets/').then((r) => setPresets(r.data)).catch(() => {})
    api.get('/api/catalog/categories/').then((r) => setCategories(r.data)).catch(() => {})
    api.get('/api/catalog/global-extras/').then((r) => setGlobalExtras(r.data)).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => {
    const today = new Date().toISOString().slice(0, 10)
    setEditing({ id: 0, name: '', date: today, pitch_cost: null, pitch_percent: null, staff_entries: [], item_overrides: [], is_active: false, created_at: '', total_staffing_cost: 0, pl_summary: { order_count: 0, revenue: 0, cogs: 0, gross_profit: 0, pitch_cost: 0, pitch_percent: 0, pitch_percent_cost: 0, staffing_cost: 0, net_profit: 0 } })
    setDraftName('')
    setDraftDate(today)
    setDraftPitchCost('')
    setDraftPitchPercent('')
    setDraftStaff([{ ...EMPTY_STAFF }])
    setDraftItems([])
  }

  const openEdit = (e: Event) => {
    setEditing(e)
    setDraftName(e.name)
    setDraftDate(e.date)
    setDraftPitchCost(e.pitch_cost ?? '')
    setDraftPitchPercent(e.pitch_percent ?? '')
    setDraftStaff(e.staff_entries.length ? e.staff_entries.map(s => ({ ...s })) : [{ ...EMPTY_STAFF }])
    setDraftItems(e.item_overrides.map(i => ({ ...i, price_override: i.price_override ?? '' })) as ItemOverride[])
  }

  const getOverride = (type: string, id: number) =>
    draftItems.find(i => i.type === type && i.id === id)

  const toggleItem = (type: 'product' | 'variation', id: number, defaultPrice: string) => {
    setDraftItems(prev => {
      const exists = prev.find(i => i.type === type && i.id === id)
      if (exists) return prev.filter(i => !(i.type === type && i.id === id))
      return [...prev, { type, id, price_override: '' }]
    })
  }

  const setOverridePrice = (type: string, id: number, price: string) => {
    setDraftItems(prev => prev.map(i => i.type === type && i.id === id ? { ...i, price_override: price } : i))
  }

  const updateStaff = (idx: number, field: keyof StaffEntry, val: string) => {
    setDraftStaff(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  const save = async () => {
    if (!draftName.trim() || !draftDate) return
    setSaving(true)
    try {
      const payload = {
        name: draftName.trim(),
        date: draftDate,
        pitch_cost: draftPitchCost ? parseFloat(draftPitchCost) : null,
        pitch_percent: draftPitchPercent ? parseFloat(draftPitchPercent) : null,
        staff_entries: draftStaff.filter(s => s.name.trim()).map(s => ({
          name: s.name.trim(),
          hours: parseFloat(s.hours) || 0,
          hourly_rate: parseFloat(s.hourly_rate) || 0,
        })),
        item_overrides: draftItems.map(i => ({
          type: i.type,
          id: i.id,
          price_override: i.price_override ? parseFloat(i.price_override) : null,
        })),
      }
      if (editing!.id) {
        const { data } = await api.patch(`/api/events/${editing!.id}/`, payload)
        setEvents(prev => prev.map(e => e.id === data.id ? data : e))
      } else {
        const { data } = await api.post('/api/events/', payload)
        setEvents(prev => [data, ...prev])
      }
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const toggleActivate = async (event: Event) => {
    setActivating(event.id)
    try {
      const { data } = await api.post(`/api/events/${event.id}/activate/`, { activate: !event.is_active })
      setEvents(prev => prev.map(e => {
        if (e.id === data.id) return data
        if (data.is_active && e.is_active) return { ...e, is_active: false }
        return e
      }))
    } finally {
      setActivating(null)
    }
  }

  const deleteEvent = async (id: number) => {
    setDeleting(id)
    try {
      await api.delete(`/api/events/${id}/`)
      setEvents(prev => prev.filter(e => e.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const loadPreset = (preset: EventPreset) => {
    setDraftPitchCost(preset.pitch_cost ? String(preset.pitch_cost) : '')
    setDraftPitchPercent(preset.pitch_percent ? String(preset.pitch_percent) : '')
    setDraftStaff(preset.staff_entries.length ? preset.staff_entries.map(s => ({ ...s })) : [{ ...EMPTY_STAFF }])
    setDraftItems(preset.item_overrides.map(i => ({ ...i, price_override: i.price_override ?? '' })) as ItemOverride[])
  }

  const openSavePreset = (event: Event) => {
    setSavePresetModal(event)
    setPresetName(event.name)
  }

  const savePreset = async () => {
    if (!savePresetModal || !presetName.trim()) return
    setSavingPreset(true)
    try {
      const payload = {
        name: presetName.trim(),
        pitch_cost: savePresetModal.pitch_cost ? parseFloat(String(savePresetModal.pitch_cost)) : null,
        pitch_percent: savePresetModal.pitch_percent ? parseFloat(String(savePresetModal.pitch_percent)) : null,
        staff_entries: savePresetModal.staff_entries,
        item_overrides: savePresetModal.item_overrides,
      }
      const { data } = await api.post('/api/events/presets/', payload)
      setPresets(prev => [...prev, data])
      setSavePresetModal(null)
    } finally {
      setSavingPreset(false)
    }
  }

  const deletePreset = async (id: number) => {
    setDeletingPreset(id)
    try {
      await api.delete(`/api/events/presets/${id}/`)
      setPresets(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeletingPreset(null)
    }
  }

  // ---- Staff total calc ----
  const staffTotal = draftStaff.reduce((sum, s) => sum + (parseFloat(s.hours) || 0) * (parseFloat(s.hourly_rate) || 0), 0)

  // ---- Edit form ----
  if (editing !== null) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">←</button>
          <h1 className="text-xl font-bold text-gray-900">{editing.id ? `Edit: ${editing.name}` : 'New event'}</h1>
        </div>

        {/* Load preset */}
        {presets.length > 0 && (
          <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
            <span className="text-sm text-brand-700 font-medium">Load preset:</span>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p)}
                  className="text-sm bg-white border border-brand-200 text-brand-700 px-3 py-1 rounded-lg hover:bg-brand-50 font-medium transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Basic details */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700">Event details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event name</label>
              <input value={draftName} onChange={e => setDraftName(e.target.value)} className="input-field" placeholder="e.g. Christmas Market, Summer Festival" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pitch / site cost (£)</label>
              <input type="number" min={0} step="0.01" value={draftPitchCost} onChange={e => setDraftPitchCost(e.target.value)} className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organiser commission (%)</label>
              <input type="number" min={0} max={100} step="0.1" value={draftPitchPercent} onChange={e => setDraftPitchPercent(e.target.value)} className="input-field" placeholder="e.g. 10" />
            </div>
          </div>
        </div>

        {/* Staff */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Staff</h2>
            {staffTotal > 0 && <span className="text-sm font-semibold text-gray-500">Total: £{staffTotal.toFixed(2)}</span>}
          </div>
          <div className="space-y-2">
            {draftStaff.map((s, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input value={s.name} onChange={e => updateStaff(idx, 'name', e.target.value)} placeholder="Name" className="input-field flex-1" />
                <input type="number" min={0} step="0.5" value={s.hours} onChange={e => updateStaff(idx, 'hours', e.target.value)} placeholder="Hrs" className="input-field w-20" />
                <input type="number" min={0} step="0.01" value={s.hourly_rate} onChange={e => updateStaff(idx, 'hourly_rate', e.target.value)} placeholder="£/hr" className="input-field w-24" />
                <button onClick={() => setDraftStaff(prev => prev.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-400 text-lg leading-none px-1">×</button>
              </div>
            ))}
          </div>
          <button onClick={() => setDraftStaff(prev => [...prev, { ...EMPTY_STAFF }])} className="text-sm text-brand-600 font-medium hover:text-brand-700">+ Add staff member</button>
        </div>

        {/* Item overrides */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-700">Menu items for this event</h2>
              <p className="text-xs text-gray-400 mt-0.5">Select items to show. Set an event price to override the normal price, or leave blank to use the standard price.</p>
            </div>
            <span className="text-xs text-gray-400">{draftItems.length} selected</span>
          </div>

          {categories.map(cat => (
            <div key={cat.id}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{cat.name}</p>
              <div className="space-y-1">
                {cat.products.map(p => (
                  <div key={p.id}>
                    {!p.has_variations && (
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={!!getOverride('product', p.id)}
                          onChange={() => toggleItem('product', p.id, p.base_price ?? '')}
                          className="w-4 h-4 rounded text-brand-600"
                        />
                        <span className="text-sm text-gray-800 flex-1">{p.name}</span>
                        <span className="text-xs text-gray-400 w-14 text-right">{p.base_price ? `£${Number(p.base_price).toFixed(2)}` : ''}</span>
                        {getOverride('product', p.id) && (
                          <input
                            type="number" min={0} step="0.01"
                            value={getOverride('product', p.id)?.price_override ?? ''}
                            onChange={e => setOverridePrice('product', p.id, e.target.value)}
                            placeholder="Event £"
                            className="input-field w-28 text-sm py-1"
                          />
                        )}
                      </div>
                    )}
                    {p.has_variations && p.variations.map(v => (
                      <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 ml-4">
                        <input
                          type="checkbox"
                          checked={!!getOverride('variation', v.id)}
                          onChange={() => toggleItem('variation', v.id, v.retail_price)}
                          className="w-4 h-4 rounded text-brand-600"
                        />
                        <span className="text-sm text-gray-800 flex-1">{p.name} — {v.name}</span>
                        <span className="text-xs text-gray-400 w-14 text-right">£{Number(v.retail_price).toFixed(2)}</span>
                        {getOverride('variation', v.id) && (
                          <input
                            type="number" min={0} step="0.01"
                            value={getOverride('variation', v.id)?.price_override ?? ''}
                            onChange={e => setOverridePrice('variation', v.id, e.target.value)}
                            placeholder="Event £"
                            className="input-field w-28 text-sm py-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {globalExtras.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Extras</p>
              <div className="space-y-1">
                {globalExtras.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={!!getOverride('global_extra' as 'product', e.id)}
                      onChange={() => toggleItem('product', e.id, e.price)}
                      className="w-4 h-4 rounded text-brand-600"
                    />
                    <span className="text-sm text-gray-800 flex-1">{e.name}</span>
                    <span className="text-xs text-gray-400 w-14 text-right">£{Number(e.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={save} disabled={saving || !draftName.trim() || !draftDate} className="btn-primary disabled:opacity-40">
            {saving ? 'Saving…' : 'Save event'}
          </button>
          <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
        </div>
      </div>
    )
  }

  // ---- List view ----
  const activeEvent = events.find(e => e.is_active)

  return (
    <>
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set event-specific menus and pricing, track costs, and see P&amp;L per day.</p>
        </div>
        <button onClick={startNew} className="btn-primary">+ New event</button>
      </div>

      {activeEvent && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-green-600 text-lg">🟢</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">Live now: {activeEvent.name}</p>
            <p className="text-xs text-green-600">
              {activeEvent.item_overrides.length} item{activeEvent.item_overrides.length !== 1 ? 's' : ''} · customers see your event menu
            </p>
          </div>
          <button
            onClick={() => toggleActivate(activeEvent)}
            disabled={activating === activeEvent.id}
            className="text-sm font-medium text-green-700 hover:text-red-600 border border-green-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {activating === activeEvent.id ? '…' : 'Deactivate'}
          </button>
        </div>
      )}

      {/* Presets section */}
      {presets.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Saved presets</h2>
          <div className="space-y-2">
            {presets.map(p => (
              <div key={p.id} className="card py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.item_overrides.length} item{p.item_overrides.length !== 1 ? 's' : ''}
                    {p.pitch_cost ? ` · pitch £${Number(p.pitch_cost).toFixed(2)}` : ''}
                    {p.pitch_percent ? ` · ${Number(p.pitch_percent)}% commission` : ''}
                    {p.staff_entries.length > 0 ? ` · ${p.staff_entries.length} staff` : ''}
                  </p>
                </div>
                <button
                  onClick={() => deletePreset(p.id)}
                  disabled={deletingPreset === p.id}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >
                  {deletingPreset === p.id ? '…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🎪</p>
          <p className="text-gray-500 font-medium">No events yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create an event to set custom pricing, track pitch costs and staffing, and see your P&amp;L per day.</p>
          <button onClick={startNew} className="btn-primary">Create your first event</button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const pl = event.pl_summary
            const hasData = pl.order_count > 0 || pl.pitch_cost > 0 || pl.staffing_cost > 0
            return (
              <div key={event.id} className={`card ${event.is_active ? 'ring-2 ring-green-400' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{event.name}</p>
                      {event.is_active && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Live</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {event.item_overrides.length > 0 && ` · ${event.item_overrides.length} item${event.item_overrides.length !== 1 ? 's' : ''}`}
                      {event.pitch_cost && ` · pitch £${Number(event.pitch_cost).toFixed(2)}`}
                      {event.pitch_percent && ` · ${Number(event.pitch_percent)}% commission`}
                      {event.total_staffing_cost > 0 && ` · staff £${event.total_staffing_cost.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActivate(event)}
                      disabled={activating === event.id}
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        event.is_active
                          ? 'text-red-600 border-red-200 hover:bg-red-50'
                          : 'text-green-700 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      {activating === event.id ? '…' : event.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openEdit(event)} className="btn-secondary text-sm">Edit</button>
                    <button
                      onClick={() => openSavePreset(event)}
                      className="text-sm text-brand-600 hover:text-brand-800 font-medium px-2"
                      title="Save as reusable preset"
                    >
                      Save preset
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      disabled={deleting === event.id}
                      className="text-sm text-red-400 hover:text-red-600 font-medium px-2"
                    >
                      {deleting === event.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>

                {hasData && <PLCard pl={pl} />}
              </div>
            )
          })}
        </div>
      )}
    </div>

    {/* Save-preset modal */}
    {savePresetModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Save as preset</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preset name</label>
            <input
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              className="input-field"
              placeholder="e.g. Christmas Market"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-400">
            Saves the menu items, prices, pitch cost and staff template so you can load them into a new event day instantly.
          </p>
          <div className="flex gap-3">
            <button
              onClick={savePreset}
              disabled={savingPreset || !presetName.trim()}
              className="btn-primary flex-1"
            >
              {savingPreset ? 'Saving…' : 'Save preset'}
            </button>
            <button onClick={() => setSavePresetModal(null)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
