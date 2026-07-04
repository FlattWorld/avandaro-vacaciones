'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

const SUBCOMPANIES = ['AOT CRA', 'AOT CTM', 'AOT VILLAS', 'CONFIANZA AOT', 'CONFIANZA DASA', 'CORP']

export function EmployeeFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.push(`/rh/empleados?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        type="search"
        defaultValue={searchParams.get('search') ?? ''}
        placeholder="Buscar por nombre…"
        onKeyDown={(e) => {
          if (e.key === 'Enter') update('search', e.currentTarget.value)
        }}
        onChange={(e) => {
          if (e.target.value === '') update('search', '')
        }}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 w-56"
      />
      <select
        defaultValue={searchParams.get('subcompany') ?? ''}
        onChange={(e) => update('subcompany', e.target.value)}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="">Todas las subempresas</option>
        {SUBCOMPANIES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  )
}
