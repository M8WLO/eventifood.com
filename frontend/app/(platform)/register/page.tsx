'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { setToken } from '@/lib/auth'
import Cookies from 'js-cookie'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    store_name: '',
    store_slug: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      // Step 1: Register user
      const { data: authData } = await api.post('/api/auth/register/', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      })
      setToken(authData.access, authData.refresh)

      // Step 2: Register tenant
      const { data: tenantData } = await api.post('/api/tenants/register/', {
        name: form.store_name,
        slug: form.store_slug,
      })
      Cookies.set('tenant_slug', tenantData.tenant.slug, { expires: 7, sameSite: 'lax' })

      router.push('/seller/dashboard')
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

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center px-4 py-12">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Store URL slug</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-400 shrink-0">eventifood.com/</span>
                <input name="store_slug" value={form.store_slug} onChange={handleChange} required className="input-field" placeholder="burger-bliss" pattern="[a-z0-9\-]+" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers and hyphens only</p>
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating your store…' : 'Create store & sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
