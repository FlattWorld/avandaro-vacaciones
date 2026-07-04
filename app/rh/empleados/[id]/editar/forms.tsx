'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { actualizarEmpleado, agregarDiasBonus, eliminarEmpleado } from './actions'
import type { Employee, VacationPeriod } from '@/lib/supabase/types'

const SUBCOMPANIES = ['AOT CRA', 'AOT CTM', 'AOT VILLAS', 'CONFIANZA AOT', 'CONFIANZA DASA', 'CORP']

// ── Formulario: datos del empleado ───────────────────────────────────────────

export function EditInfoForm({ employee }: { employee: Employee }) {
  const action = actualizarEmpleado.bind(null, employee.id)
  const [state, formAction, pending] = useActionState(action, { error: '' })

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            defaultValue={employee.full_name}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Correo electrónico{' '}
            <span className="text-slate-400 font-normal">(para acceso al sistema)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={employee.email ?? ''}
            placeholder="Sin acceso al sistema"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="hire_date" className="block text-sm font-medium text-slate-700">
            Fecha de ingreso
          </label>
          <input
            id="hire_date"
            name="hire_date"
            type="date"
            required
            defaultValue={employee.hire_date}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="subcompany" className="block text-sm font-medium text-slate-700">
            Subempresa
          </label>
          <select
            id="subcompany"
            name="subcompany"
            required
            defaultValue={employee.subcompany}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {SUBCOMPANIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="role" className="block text-sm font-medium text-slate-700">
            Rol
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue={employee.role}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="empleado">Empleado</option>
            <option value="rh">RH</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link
          href={`/rh/empleados/${employee.id}`}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}

// ── Formulario: días bonus ────────────────────────────────────────────────────

export function BonusDaysForm({
  employeeId,
  periods,
}: {
  employeeId: string
  periods: VacationPeriod[]
}) {
  const action = agregarDiasBonus.bind(null, employeeId)
  const [state, formAction, pending] = useActionState(action, { error: '' })

  if (periods.length === 0) {
    return (
      <p className="text-sm text-slate-400">Este empleado no tiene periodos registrados.</p>
    )
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="period_id" className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
          Periodo
        </label>
        <select
          id="period_id"
          name="period_id"
          required
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {periods.map((p) => {
            const available = p.days_assigned + p.days_bonus - p.days_used
            return (
              <option key={p.id} value={p.id}>
                Año {p.period_year} — vence {fmtDate(p.expiry_date)} — {available} disp.
              </option>
            )
          })}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="days" className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
          Días <span className="text-slate-400">(+ agregar · − quitar)</span>
        </label>
        <input
          id="days"
          name="days"
          type="number"
          required
          placeholder="ej. 2 ó -1"
          className="w-28 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Aplicando…' : 'Aplicar'}
      </button>

      {state.error && (
        <p className="w-full text-sm text-red-600" role="alert">{state.error}</p>
      )}
    </form>
  )
}

// ── Formulario: eliminar empleado ─────────────────────────────────────────────

export function DeleteForm({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const action = eliminarEmpleado.bind(null, employeeId)
  const [state, formAction, pending] = useActionState(action, { error: '' })

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-slate-600">
        Esto eliminará a <strong>{employeeName}</strong> junto con todos sus periodos y solicitudes.
        Esta acción no se puede deshacer.
      </p>
      <div className="space-y-1">
        <label htmlFor="confirmation" className="block text-sm font-medium text-slate-700">
          Escribe <span className="font-mono font-bold">ELIMINAR</span> para confirmar
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          placeholder="ELIMINAR"
          className="w-full rounded-xl border border-red-300 px-3 py-2.5 text-sm text-slate-900 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Eliminando…' : 'Eliminar empleado'}
      </button>
    </form>
  )
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    month: 'short',
    year: 'numeric',
  })
}
