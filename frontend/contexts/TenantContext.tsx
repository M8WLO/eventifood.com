'use client'

import React, { createContext, useContext, useState } from 'react'
import Cookies from 'js-cookie'

interface TenantContextValue {
  tenantSlug: string | null
  setTenantSlug: (slug: string | null) => void
  tenantName: string | null
  setTenantName: (name: string | null) => void
}

const TenantContext = createContext<TenantContextValue>({
  tenantSlug: null,
  setTenantSlug: () => {},
  tenantName: null,
  setTenantName: () => {},
})

export function TenantProvider({ children, initialSlug }: { children: React.ReactNode; initialSlug?: string }) {
  const [tenantSlug, setTenantSlugState] = useState<string | null>(initialSlug || Cookies.get('tenant_slug') || null)
  const [tenantName, setTenantName] = useState<string | null>(null)

  const setTenantSlug = (slug: string | null) => {
    setTenantSlugState(slug)
    if (slug) {
      Cookies.set('tenant_slug', slug, { expires: 7, sameSite: 'lax' })
    } else {
      Cookies.remove('tenant_slug')
    }
  }

  return (
    <TenantContext.Provider value={{ tenantSlug, setTenantSlug, tenantName, setTenantName }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}
