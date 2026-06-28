'use client'

import { useActionState } from 'react'
import { crearSolicitudPorRH } from './actions'
import type { PeriodBalance } from '@/lib/supabase/types'

export default function RhSolicitarForm({
  employeeId,
  periods,
}: {
  employeeId: string
  periods: PeriodBalance[]
}) {
  const action = crearSolicitudPorRH.bind(null, employeeId)
  const [state, formAction, pending] = useActionState(action, { error: '' })

  if (periods.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500 text-sm">
        No hay periodos con saldo disponible.
      </div>
    )
  }

  return (
    <form action={formAction} className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
      <div>
        <label htmlFor="period_id" className="block text-sm font-medium text-stone-700">
          Periodo a descontar
        </label>
        <select
          id="period_id"
          name="period_id"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              Año {p.period_year} — {p.days_available} días disponibles (vence{' '}
              {new Date(p.expiry_date + 'T00:00:00').toLocaleDateString('es-MX', {
                month: 'short',
                year: 'numeric',
              })}
              )
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-stone-700">
            Fecha de inicio
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-stone-700">
            Fecha de fin
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-stone-700">
          Notas <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Motivo o comentarios…"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Registrando…' : 'Registrar vacaciones'}
      </button>

      <p className="text-xs text-center text-stone-400">
        La solicitud se registra como aprobada automáticamente.
      </p>
    </form>
  )
}
