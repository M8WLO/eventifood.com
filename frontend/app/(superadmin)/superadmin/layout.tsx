'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUser } from '@/lib/auth'

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center gap-4">
        <h1 className="text-lg font-bold text-orange-400">Eventifood Admin</h1>
        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">Superadmin</span>
      </header>
      <main>{children}</main>
    </div>
  )
}
