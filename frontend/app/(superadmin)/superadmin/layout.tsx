'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, getUser } from '@/lib/auth'

const NAV = [
  { href: '/superadmin', label: 'Platform Settings', icon: '⚙️', tab: null },
  { href: '/superadmin?tab=tenants', label: 'Tenant Management', icon: '🏪', tab: 'tenants' },
  { href: '/superadmin/plans', label: 'Plans', icon: '💳', tab: null },
  { href: '/superadmin/promotions', label: 'Promotions', icon: '🎉', tab: null },
]

function SuperAdminNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')

  return (
    <nav className="flex items-center gap-1 ml-4">
      {NAV.map((item) => {
        let active: boolean
        if (item.href === '/superadmin') {
          active = pathname === '/superadmin' && !currentTab
        } else if (item.tab) {
          active = pathname === '/superadmin' && currentTab === item.tab
        } else {
          active = pathname.startsWith(item.href)
        }
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
  )
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
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
        <Suspense fallback={<nav className="flex items-center gap-1 ml-4" />}>
          <SuperAdminNav />
        </Suspense>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
