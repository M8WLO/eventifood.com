'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { isAuthenticated, clearToken } from '@/lib/auth'
import api from '@/lib/api'

const NAV = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/seller/menu', label: 'Menu', icon: '🍽️' },
  { href: '/seller/orders', label: 'Orders', icon: '🧾' },
  { href: '/seller/inventory', label: 'Inventory', icon: '📦' },
  { href: '/seller/analytics', label: 'Analytics', icon: '📊' },
  { href: '/seller/settings', label: 'Settings', icon: '⚙️' },
]

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    // Restore tenant_slug cookie if missing (e.g. new device or cookie expired).
    // Must wait for it before setReady so child pages don't fire API calls without the slug.
    if (!Cookies.get('tenant_slug')) {
      api.get('/api/tenants/mine/')
        .then((r) => {
          Cookies.set('tenant_slug', r.data.slug, { expires: 7, sameSite: 'lax' })
        })
        .catch(() => {})
        .finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-gray-100">
          <span className="text-lg font-extrabold text-brand-500">Eventifood</span>
          <span className="block text-xs text-gray-400 mt-0.5">Seller portal</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => { clearToken(); router.push('/login') }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors w-full text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
