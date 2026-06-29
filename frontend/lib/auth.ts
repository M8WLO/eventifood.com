import Cookies from 'js-cookie'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export interface JWTPayload {
  user_id: number
  email?: string
  exp: number
  iat: number
  is_superadmin?: boolean
}

export function getToken(): string | undefined {
  return Cookies.get(ACCESS_KEY)
}

export function setToken(access: string, refresh: string): void {
  Cookies.set(ACCESS_KEY, access, { expires: 7, sameSite: 'lax' })
  Cookies.set(REFRESH_KEY, refresh, { expires: 7, sameSite: 'lax' })
}

export function clearToken(): void {
  Cookies.remove(ACCESS_KEY)
  Cookies.remove(REFRESH_KEY)
  Cookies.remove('tenant_slug')
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false
  try {
    const payload = getUser(token)
    return payload !== null && payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function getUser(token?: string): JWTPayload | null {
  const t = token || getToken()
  if (!t) return null
  try {
    const base64 = t.split('.')[1]
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JWTPayload
  } catch {
    return null
  }
}
