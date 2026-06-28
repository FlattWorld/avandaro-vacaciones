'use client'

import { useActionState, useState, useEffect } from 'react'
import { crearSolicitudPorRH } from './actions'

const WEEKDAY_HEADERS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = []
  const current = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return days
}

function buildCalendarGrid(days: string[]): (string | null)[] {
  if (days.length === 0) return []
  const first = new Date(days[0] + 'T00:00:00')
  const firstDow = (first.getDay() + 6) % 7
  const grid: (string | null)[] = Array(firstDow).fill(null)
  grid.push(...days)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function isWeekend(iso: string): boolean {
  return (new Date(iso + 'T00:00:00').getDay() + 6) % 7 >= 5
}

export default function RhSolicitarForm({
  employeeId,
  totalAvailable,
}: {
  employeeId: string
  totalAvailable: number
}) {
  const action = crearSolicitudPorRH.bind(null, employeeId)
  const [state, formAction, pending] = useActionState(action, { error: '' })

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())

  const daysInRange =
    startDate && endDate && endDate >= startDate
      ? getDaysInRange(startDate, endDate)
      : []

  useEffect(() => {
    setSelectedDays(daysInRange.length > 0 ? new Set(daysInRange) : new Set())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const toggleDay = (iso: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev)
      next.has(iso) ? next.delete(iso) : next.add(iso)
      return next
    })
  }

  const totalVacDays = selectedDays.size
  const canSubmit = totalVacDays > 0 && !pending
  const calendarGrid = buildCalendarGrid(daysInRange)

  if (totalAvailable === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
        No hay días disponibles en ningún periodo activo.
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Saldo */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-amber-800">Días disponibles</span>
        <span className="text-2xl font-bold text-amber-700">{totalAvailable}</span>
      </div>

      {/* Rango */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        <p className="text-sm font-medium text-slate-600">Fechas</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="start_date" className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Desde
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="end_date" className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Hasta
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Selector de días */}
      {calendarGrid.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-700">¿Cuáles días son vacaciones?</p>
            <p className="text-xs text-slate-400 mt-0.5">Toca los días de descanso para desmarcarlos.</p>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_HEADERS.map((h) => (
              <div key={h} className="text-center text-xs font-semibold text-slate-400 py-1">{h}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((iso, i) => {
              if (!iso) return <div key={`e-${i}`} />
              const selected = selectedDays.has(iso)
              const num = new Date(iso + 'T00:00:00').getDate()
              const showMonth = num === 1
              const month = showMonth
                ? new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' })
                : null
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => toggleDay(iso)}
                  className={`flex flex-col items-center justify-center rounded-xl h-14 select-none transition-all active:scale-95 ${
                    selected
                      ? 'bg-amber-100 border-2 border-amber-400 text-amber-900'
                      : isWeekend(iso)
                        ? 'bg-slate-100 border border-slate-200 text-slate-400'
                        : 'bg-slate-50 border border-slate-200 text-slate-400'
                  }`}
                >
                  <span className={`text-base font-bold leading-none ${selected ? 'text-amber-900' : 'text-slate-400'}`}>
                    {num}
                  </span>
                  {showMonth && (
                    <span className="text-[9px] uppercase tracking-wide leading-tight mt-0.5 opacity-70">
                      {month}
                    </span>
                  )}
                  <span className={`text-[9px] uppercase tracking-wide leading-tight mt-0.5 font-semibold ${selected ? 'text-amber-600' : 'text-slate-400'}`}>
                    {selected ? 'vac' : 'des'}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              {daysInRange.length - totalVacDays} descanso{daysInRange.length - totalVacDays !== 1 ? 's' : ''}
            </span>
            <span className={`text-sm font-semibold ${totalVacDays > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
              {totalVacDays} día{totalVacDays !== 1 ? 's' : ''} de vacaciones
            </span>
          </div>
        </div>
      )}

      <input type="hidden" name="total_days" value={totalVacDays} />

      {/* Notas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium text-slate-600">
          Notas <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Motivo o comentarios…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700" role="alert">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-amber-600 px-4 py-4 text-base font-semibold text-white hover:bg-amber-700 active:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {pending
          ? 'Registrando…'
          : totalVacDays > 0
            ? `Registrar ${totalVacDays} día${totalVacDays !== 1 ? 's' : ''} · aprobado`
            : 'Registrar vacaciones'}
      </button>
    </form>
  )
}
