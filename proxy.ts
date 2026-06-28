import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { maxAge, expires, ...sessionOptions } = options ?? {}
            supabaseResponse.cookies.set(name, value, sessionOptions)
          })
        },
      },
    }
  )

  // Refrescar la sesión sin leer user para no bloquear el Edge Runtime
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas públicas (no requieren sesión)
  const publicPaths = ['/login', '/auth/callback', '/auth/confirm', '/auth/signout']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    // Redirigir al login guardando la URL de destino
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // No redirigir al login si ya tiene sesión activa
  // (el app/page.tsx decide a dónde va según el rol)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
