'use client'

import { useState } from 'react'

interface Step {
  text: string
  note?: string
}

export function SetupGuide({
  time,
  steps,
  notes,
}: {
  time: string
  steps: (Step | string)[]
  notes?: string[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-blue-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-sm font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>📋</span>
          <span>Setup guide</span>
          <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
            {time}
          </span>
        </span>
        <span className="text-blue-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="bg-white px-4 py-4 text-sm text-gray-700 space-y-3 border-t border-blue-100">
          <ol className="space-y-3">
            {steps.map((step, i) => {
              const text = typeof step === 'string' ? step : step.text
              const note = typeof step === 'string' ? undefined : step.note
              return (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <span>{text}</span>
                    {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
          {notes && notes.length > 0 && (
            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              {notes.map((note, i) => (
                <p key={i} className="text-xs text-gray-500 flex gap-2 items-start">
                  <span className="text-gray-300 shrink-0 mt-px">ℹ</span>
                  <span>{note}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}
