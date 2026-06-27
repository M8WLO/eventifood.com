'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getUser } from '@/lib/auth'

const NAV = [
  { href: '/superadmin', label: 'Tenants', icon: '🏪' },
  { href: '/superadmin/plans', label: 'Plans', icon: '💳' },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    const user = getUser()
    if (!user?.is_superadmin) {
      router.replace('/')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Checking permissions…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-brand-400">Eventifood Admin</h1>
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">Superadmin</span>
        </div>
        <nav className="flex items-center gap-1 ml-4">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{item.icon}</span>{item.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
