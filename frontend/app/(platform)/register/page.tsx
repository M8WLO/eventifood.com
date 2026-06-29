'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    store_name: '',
    store_slug: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'store_name') {
        updated.store_slug = slugify(value)
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/api/auth/register/', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        store_name: form.store_name,
        store_slug: form.store_slug,
      })
      setDone(true)
    } catch (err: any) {
      const msg = err?.response?.data
      if (typeof msg === 'object') {
        setError(Object.values(msg).flat().join(' '))
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-brand-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 mb-6">
            We&apos;ve sent a verification link to <span className="font-medium text-gray-800">{form.email}</span>.
            Click it to activate your store and sign in.
          </p>
          <p className="text-sm text-gray-400">
            Didn&apos;t get it? Check your spam folder, or{' '}
            <button onClick={() => setDone(false)} className="text-brand-600 hover:underline">
              go back and try again
            </button>
            .
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-brand-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Create your store</h1>
          <p className="text-gray-500 mt-2">Get your food truck online in minutes</p>
        </div>
        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required className="input-field" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} className="input-field" placeholder="Min 8 characters" />
            </div>
            <hr className="my-2 border-gray-100" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store name</label>
              <input name="store_name" value={form.store_name} onChange={handleChange} required className="input-field" placeholder="Burger Bliss" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your store URL</label>
              <div className="flex items-center rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-brand-400 overflow-hidden">
                <input
                  name="store_slug"
                  value={form.store_slug}
                  onChange={handleChange}
                  required
                  className="flex-1 px-3 py-2 text-sm outline-none bg-white min-w-0"
                  placeholder="andys-burgers"
                  pattern="[a-z0-9\-]+"
                />
                <span className="text-sm text-gray-400 bg-gray-50 border-l border-gray-200 px-3 py-2 shrink-0">.eventifood.com</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers and hyphens only</p>
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating your store…' : 'Create store'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
