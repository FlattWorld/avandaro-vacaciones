'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { EmployeeRole } from '@/lib/supabase/types'

interface NavProps {
  role: EmployeeRole
  fullName: string
}

const employeeLinks = [
  { href: '/dashboard', label: 'Mi saldo' },
  { href: '/dashboard/solicitar', label: 'Solicitar días' },
  { href: '/dashboard/historial', label: 'Historial' },
]

const rhLinks = [
  { href: '/rh', label: 'Panel' },
  { href: '/rh/solicitudes', label: 'Solicitudes' },
  { href: '/rh/empleados', label: 'Empleados' },
  { href: '/rh/reglas', label: 'Reglas' },
]

export default function Nav({ role, fullName }: NavProps) {
  const pathname = usePathname()
  const links = role === 'rh' ? rhLinks : employeeLinks

  return (
    <header className="bg-white border-b border-stone-200">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-stone-900 text-sm">
              Avándaro
            </span>
            <nav className="flex items-center gap-1">
              {links.map(({ href, label }) => {
                const active =
                  href === '/rh' || href === '/dashboard'
                    ? pathname === href
                    : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? 'bg-amber-50 text-amber-700 font-medium'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500 hidden sm:block">
              {fullName}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
