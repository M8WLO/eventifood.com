'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Cookies from 'js-cookie'
import { isAuthenticated, clearToken } from '@/lib/auth'
import api from '@/lib/api'

interface NavItem {
  href: string
  label: string
  icon: string
  flag?: string  // feature flag key required to show this item
}

const NAV: NavItem[] = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/seller/menu', label: 'Menu', icon: '🍽️' },
  { href: '/seller/orders', label: 'Orders', icon: '🧾' },
  { href: '/seller/payment-portal', label: 'Payment Portal', icon: '💳' },
  { href: '/seller/settings', label: 'Settings', icon: '⚙️' },
]

const FEATURE_NAV: NavItem[] = [
  { href: '/seller/menu/print', label: 'Print menus', icon: '🖨️', flag: 'print_menus' },
  { href: '/seller/inventory', label: 'Inventory', icon: '📦', flag: 'inventory' },
  { href: '/seller/wastage', label: 'Wastage', icon: '🗑️', flag: 'wastage' },
  { href: '/seller/analytics', label: 'Analytics', icon: '📊', flag: 'analytics' },
  { href: '/seller/events', label: 'Events', icon: '🎪', flag: 'events' },
  { href: '/seller/discounts', label: 'Discounts', icon: '🏷️', flag: 'discounts' },
]

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }

    const loadTenant = api.get('/api/tenants/mine/')
      .then((r) => {
        Cookies.set('tenant_slug', r.data.slug, { expires: 7, sameSite: 'lax' })
        setIsDemo(!!r.data.is_demo)
      })
      .catch(() => {})

    const loadPlan = api.get('/api/subscriptions/my-plan/')
      .then((r) => {
        const planFlags: string[] = r.data?.plan?.feature_flags || []
        const globalFlags: string[] = r.data?.global_feature_flags || []
        setFeatureFlags(Array.from(new Set([...planFlags, ...globalFlags])))
      })
      .catch(() => {})

    Promise.all([loadTenant, loadPlan]).finally(() => setReady(true))
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  const isLocked = (item: NavItem) => !!item.flag && !featureFlags.includes(item.flag)

  const currentLockedItem = FEATURE_NAV.find(
    (item) => pathname.startsWith(item.href) && isLocked(item)
  )

  const renderLink = (item: NavItem) => {
    const active = pathname.startsWith(item.href)
    const locked = isLocked(item)
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active && !locked
            ? 'bg-brand-50 text-brand-600'
            : locked
            ? 'text-gray-300 hover:bg-gray-50 hover:text-gray-400'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <span className={`text-base ${locked ? 'opacity-40' : ''}`}>{item.icon}</span>
        <span className="relative">
          {item.label}
          {locked && (
            <span className="absolute -top-2 -right-5 text-[9px] font-bold bg-brand-500 text-white px-1 py-px rounded leading-tight">
              Pro
            </span>
          )}
        </span>
      </Link>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-gray-100">
          <span className="text-lg font-extrabold text-brand-500">Eventifood</span>
          <span className="block text-xs text-gray-400 mt-0.5">Seller portal</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV.map(renderLink)}
          <div className="pt-3 pb-1 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Features</p>
          </div>
          {FEATURE_NAV.map(renderLink)}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentLockedItem && (
          <div className="shrink-0 bg-brand-50 border-b border-brand-100 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-brand-700 font-medium">
              <span className="font-bold">{currentLockedItem.label}</span> is a Pro feature — upgrade your plan to unlock access.
            </p>
            <Link
              href="/seller/settings#subscription"
              className="text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Upgrade →
            </Link>
          </div>
        )}
        <div className="flex-1 overflow-auto relative">
          {currentLockedItem && (
            <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
            </div>
          )}
          <main className={currentLockedItem ? 'pointer-events-none select-none' : ''}>
            {children}
          </main>
        </div>
        {isDemo && (
          <div className="shrink-0 bg-orange-500 text-white text-center text-xs font-semibold py-2 px-4">
            Demo / test store — no payments will be charged to customers
          </div>
        )}
      </div>
    </div>
  )
}
