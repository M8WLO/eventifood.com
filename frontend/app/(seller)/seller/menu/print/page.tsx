'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Variation { id: number; name: string; retail_price: string; qr_code_svg: string }
interface Product {
  id: number; name: string; base_price: string | null; has_variations: boolean
  variations: Variation[]; qr_code_svg: string; category_name?: string
}
interface Category { id: number; name: string; products: Product[] }
interface GlobalExtra { id: number; name: string; price: string; qr_code_svg: string }
interface SelectedItem { type: 'product' | 'variation' | 'global_extra'; id: number }
interface PrintMenu { id: number; name: string; size: string; items: SelectedItem[]; is_default: boolean; is_web_facing: boolean; updated_at: string }

const SIZE_LABELS: Record<string, string> = { a4: 'A4', a3: 'A3', a2: 'A2' }

export default function PrintMenusPage() {
  const router = useRouter()
  const [menus, setMenus] = useState<PrintMenu[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [globalExtras, setGlobalExtras] = useState<GlobalExtra[]>([])
  const [designing, setDesigning] = useState<PrintMenu | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftSize, setDraftSize] = useState<'a4' | 'a3' | 'a2'>('a4')
  const [draftItems, setDraftItems] = useState<SelectedItem[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = useCallback(() => {
    api.get('/api/catalog/print-menus/').then((r) => setMenus(r.data)).catch(() => {})
    api.get('/api/catalog/categories/').then((r) => setCategories(r.data)).catch(() => {})
    api.get('/api/catalog/global-extras/').then((r) => setGlobalExtras(r.data)).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => {
    setDesigning({ id: 0, name: '', size: 'a4', items: [], is_default: false, is_web_facing: false, updated_at: '' })
    setDraftName('')
    setDraftSize('a4')
    setDraftItems([])
  }

  const editMenu = (m: PrintMenu) => {
    setDesigning(m)
    setDraftName(m.name)
    setDraftSize(m.size as 'a4' | 'a3' | 'a2')
    setDraftItems(m.items)
  }

  const toggleItem = (item: SelectedItem) => {
    setDraftItems((prev) => {
      const exists = prev.find((i) => i.type === item.type && i.id === item.id)
      return exists ? prev.filter((i) => !(i.type === item.type && i.id === item.id)) : [...prev, item]
    })
  }

  const isSelected = (type: string, id: number) =>
    draftItems.some((i) => i.type === type && i.id === id)

  const save = async () => {
    if (!draftName.trim()) return
    setSaving(true)
    try {
      const payload = { name: draftName.trim(), size: draftSize, items: draftItems }
      if (designing!.id) {
        const { data } = await api.patch(`/api/catalog/print-menus/${designing!.id}/`, payload)
        setMenus((prev) => prev.map((m) => m.id === data.id ? data : m))
      } else {
        const { data } = await api.post('/api/catalog/print-menus/', payload)
        setMenus((prev) => [data, ...prev])
      }
      setDesigning(null)
    } finally {
      setSaving(false)
    }
  }

  const deleteMenu = async (id: number) => {
    setDeleting(id)
    try {
      await api.delete(`/api/catalog/print-menus/${id}/`)
      setMenus((prev) => prev.filter((m) => m.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const setDefault = async (id: number) => {
    const { data } = await api.patch(`/api/catalog/print-menus/${id}/`, { is_default: true })
    setMenus((prev) => prev.map((m) => m.id === id ? data : { ...m, is_default: false }))
  }

  const toggleWebFacing = async (m: PrintMenu) => {
    const { data } = await api.patch(`/api/catalog/print-menus/${m.id}/`, { is_web_facing: !m.is_web_facing })
    setMenus((prev) => prev.map((x) => x.id === m.id ? data : x))
  }

  if (designing !== null) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setDesigning(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">←</button>
          <h1 className="text-xl font-bold text-gray-900">
            {designing.id ? `Edit: ${designing.name}` : 'New print menu'}
          </h1>
        </div>

        {/* Name + size */}
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menu name</label>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Lunch specials, Full menu, Drinks board"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paper size</label>
            <div className="flex gap-3">
              {(['a4', 'a3', 'a2'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setDraftSize(s)}
                  className={`px-5 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${draftSize === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {SIZE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Item picker */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Select items to include</h2>
            <span className="text-xs text-gray-400">{draftItems.length} selected</span>
          </div>

          {categories.map((cat) => (
            <div key={cat.id}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{cat.name}</p>
              <div className="space-y-1">
                {cat.products.map((p) => (
                  <div key={p.id}>
                    {!p.has_variations && (
                      <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected('product', p.id)}
                          onChange={() => toggleItem({ type: 'product', id: p.id })}
                          className="w-4 h-4 rounded text-brand-600"
                        />
                        <span className="text-sm text-gray-800 flex-1">{p.name}</span>
                        {p.base_price && <span className="text-xs text-gray-400">£{Number(p.base_price).toFixed(2)}</span>}
                      </label>
                    )}
                    {p.has_variations && p.variations.map((v) => (
                      <label key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={isSelected('variation', v.id)}
                          onChange={() => toggleItem({ type: 'variation', id: v.id })}
                          className="w-4 h-4 rounded text-brand-600"
                        />
                        <span className="text-sm text-gray-800 flex-1">{p.name} — {v.name}</span>
                        <span className="text-xs text-gray-400">£{Number(v.retail_price).toFixed(2)}</span>
                      </label>
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
                {globalExtras.map((e) => (
                  <label key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected('global_extra', e.id)}
                      onChange={() => toggleItem({ type: 'global_extra', id: e.id })}
                      className="w-4 h-4 rounded text-brand-600"
                    />
                    <span className="text-sm text-gray-800 flex-1">{e.name}</span>
                    <span className="text-xs text-gray-400">£{Number(e.price).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving || !draftName.trim() || draftItems.length === 0}
            className="btn-primary disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save menu'}
          </button>
          <button onClick={() => setDesigning(null)} className="btn-secondary">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Print menus</h1>
          <p className="text-sm text-gray-500 mt-0.5">Design printable A4/A3/A2 menus with QR codes your customers can scan to order.</p>
        </div>
        <button onClick={startNew} className="btn-primary">+ New menu</button>
      </div>

      {menus.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🖨️</p>
          <p className="text-gray-500 font-medium">No print menus yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create a menu to print and display at your truck</p>
          <button onClick={startNew} className="btn-primary">Create your first menu</button>
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((m) => (
            <div key={m.id} className="card space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    {m.is_default && (
                      <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Default</span>
                    )}
                    {m.is_web_facing && (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Web facing</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {SIZE_LABELS[m.size]} · {m.items.length} item{m.items.length !== 1 ? 's' : ''} ·
                    Updated {new Date(m.updated_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => editMenu(m)} className="btn-secondary text-sm">Edit</button>
                  <Link href={`/print-menu/${m.id}`} target="_blank" className="btn-primary text-sm">
                    Download PDF ↗
                  </Link>
                  <button
                    onClick={() => deleteMenu(m.id)}
                    disabled={deleting === m.id}
                    className="text-sm text-red-400 hover:text-red-600 font-medium px-2"
                  >
                    {deleting === m.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                {!m.is_default && (
                  <button
                    onClick={() => setDefault(m.id)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    Set as default
                  </button>
                )}
                <label className="flex items-center gap-2 cursor-pointer ml-auto">
                  <span className="text-xs text-gray-500">Web facing</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={m.is_web_facing}
                      onChange={() => toggleWebFacing(m)}
                    />
                    <div className={`w-8 h-4 rounded-full transition-colors ${m.is_web_facing ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${m.is_web_facing ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>
                {m.is_default && m.is_web_facing && (
                  <span className="text-xs text-gray-400">
                    Live at <span className="font-mono">…/menu</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
