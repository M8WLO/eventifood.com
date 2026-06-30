import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-production-9e5c.up.railway.app'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const res = await fetch(`${BACKEND_URL}/api/pos/lookup-tenant/`, {
      headers: { 'X-Tenant-Slug': slug },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }
    const data = await res.json()
    return NextResponse.json({ slug, api_url: BACKEND_URL, store_name: data.store_name })
  } catch {
    return NextResponse.json({ error: 'Could not reach backend' }, { status: 502 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  let body: { password?: string }
  try { body = await request.json() } catch { body = {} }

  try {
    const res = await fetch(`${BACKEND_URL}/api/pos/auth-device/`, {
      method: 'POST',
      headers: {
        'X-Tenant-Slug': slug,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: body.password || '' }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Incorrect password' }, { status: res.status })
    }
    return NextResponse.json({ ok: true, api_url: BACKEND_URL, store_name: data.store_name })
  } catch {
    return NextResponse.json({ error: 'Could not reach backend' }, { status: 502 })
  }
}
