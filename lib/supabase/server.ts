import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { maxAge, expires, ...sessionOptions } = options ?? {}
              cookieStore.set(name, value, sessionOptions)
            })
          } catch {
            // Las cookies solo se pueden escribir desde Server Actions o Route Handlers.
            // En Server Components de solo lectura este bloque se ignora.
          }
        },
      },
    }
  )
}
