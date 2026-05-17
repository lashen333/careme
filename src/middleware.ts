import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
// For production with multiple instances, replace with Upstash Redis:
// https://github.com/upstash/ratelimit
type RateLimitEntry = { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/auth/register': { max: 5,  windowMs: 60_000 },  // 5 registrations / min per IP
  '/api/auth/signin':   { max: 10, windowMs: 60_000 },  // 10 login attempts / min per IP
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (entry.count >= max) return false // blocked

  entry.count++
  return true // allowed
}

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetAt) rateLimitStore.delete(key)
    })
  }, 5 * 60_000)
}
// ──────────────────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const limit = RATE_LIMITS[pathname]

  if (limit && req.method === 'POST') {
    const ip = getClientIp(req)
    const key = `${pathname}:${ip}`
    const allowed = checkRateLimit(key, limit.max, limit.windowMs)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a moment.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(limit.max),
          },
        }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/auth/register',
    '/api/auth/signin',
    '/api/checkout',
  ],
}
