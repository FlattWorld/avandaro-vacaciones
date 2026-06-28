'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

function parseCookies(): { name: string; value: string }[] {
  if (typeof document === 'undefined') return []
  return document.cookie.split(';').flatMap((c) => {
    const idx = c.indexOf('=')
    if (idx === -1) return []
    return [{ name: c.slice(0, idx).trim(), value: c.slice(idx + 1).trim() }]
  })
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: parseCookies,
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Sin maxAge ni expires → cookie de sesión (se borra al cerrar el browser)
            const path = options?.path ?? '/'
            const sameSite = options?.sameSite ?? 'lax'
            const secure = options?.secure ? '; Secure' : ''
            document.cookie = `${name}=${value}; Path=${path}; SameSite=${sameSite}${secure}`
          })
        },
      },
    }
  )
}
