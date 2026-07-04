'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { crearRegla } from './actions'

const SUBCOMPANIES = ['AOT CRA', 'AOT CTM', 'AOT VILLAS', 'CONFIANZA AOT', 'CONFIANZA DASA', 'CORP']

export default function NuevaReglaPage() {
  const [state, formAction, pending] = useActionState(crearRegla, { error: '' })

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/rh/reglas" className="text-sm text-slate-400 hover:text-slate-600">
          ← Reglas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Nueva regla de vacaciones</h1>
      </div>

      <form action={formAction} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {/* Subempresa */}
        <div className="space-y-1">
          <label htmlFor="subcompany" className="block text-sm font-medium text-slate-700">
            Subempresa
          </label>
          <select
            id="subcompany"
            name="subcompany"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {SUBCOMPANIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Rango de años */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="year_from" className="block text-sm font-medium text-slate-700">
              Año laboral desde
            </label>
            <input
              id="year_from"
              name="year_from"
              type="number"
              min={1}
              required
              placeholder="1"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="year_to" className="block text-sm font-medium text-slate-700">
              Hasta <span className="text-slate-400 font-normal">(vacío = sin límite)</span>
            </label>
            <input
              id="year_to"
              name="year_to"
              type="number"
              min={1}
              placeholder="—"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Días y vencimiento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="days_assigned" className="block text-sm font-medium text-slate-700">
              Días asignados
            </label>
            <input
              id="days_assigned"
              name="days_assigned"
              type="number"
              min={1}
              required
              placeholder="12"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="expiry_months" className="block text-sm font-medium text-slate-700">
              Vencimiento (meses)
            </label>
            <input
              id="expiry_months"
              name="expiry_months"
              type="number"
              min={1}
              defaultValue={18}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            Notas <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            placeholder="Ej. Acuerdo sindical CTM"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {state.error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700" role="alert">{state.error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Guardando…' : 'Crear regla'}
          </button>
          <Link
            href="/rh/reglas"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
