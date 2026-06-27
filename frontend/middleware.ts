import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RESERVED_SUBDOMAINS = ['www', 'admin', 'api', 'mail']
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'eventifood.com'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0]

  // Extract subdomain
  let subdomain: string | null = null
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = hostname.replace(`.${BASE_DOMAIN}`, '')
    if (!RESERVED_SUBDOMAINS.includes(sub)) {
      subdomain = sub
    }
  }

  const requestHeaders = new Headers(request.headers)

  if (subdomain) {
    // Buyer storefront — rewrite to /store/[slug]
    requestHeaders.set('x-tenant-slug', subdomain)
    const url = request.nextUrl.clone()
    url.pathname = `/store/${subdomain}${request.nextUrl.pathname}`
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
