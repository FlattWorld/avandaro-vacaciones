'use client'

import { useActionState, useState, useEffect } from 'react'
import { crearSolicitud } from './actions'

const initialState = { error: '' }

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
  // Convert Sunday-based (0) to Monday-based (0=Mon…6=Sun)
  const firstDow = (first.getDay() + 6) % 7
  const grid: (string | null)[] = Array(firstDow).fill(null)
  grid.push(...days)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function isWeekend(iso: string): boolean {
  const dow = (new Date(iso + 'T00:00:00').getDay() + 6) % 7 // 0=Mon…6=Sun
  return dow >= 5
}

function dayNum(iso: string) {
  return new Date(iso + 'T00:00:00').getDate()
}

function monthLabel(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' })
}

export default function SolicitarForm({
  totalAvailable,
}: {
  totalAvailable: number
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string }, formData: FormData) => {
      const result = await crearSolicitud(formData)
      return result ?? { error: '' }
    },
    initialState
  )

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())

  const daysInRange =
    startDate && endDate && endDate >= startDate
      ? getDaysInRange(startDate, endDate)
      : []

  useEffect(() => {
    if (daysInRange.length > 0) {
      setSelectedDays(new Set(daysInRange))
    } else {
      setSelectedDays(new Set())
    }
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

  return (
    <form action={formAction} className="space-y-5">
      {/* Saldo disponible */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-amber-800">Días disponibles</span>
        <span className="text-2xl font-bold text-amber-700">{totalAvailable}</span>
      </div>

      {/* Rango de fechas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        <p className="text-sm font-medium text-slate-600">¿Cuándo serán tus vacaciones?</p>
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

      {/* Selector de días — calendario */}
      {calendarGrid.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-700">¿Cuáles días son vacaciones?</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Toca los días de descanso para desmarcarlos.
            </p>
          </div>

          {/* Cabecera días de la semana */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_HEADERS.map((h) => (
              <div key={h} className="text-center text-xs font-semibold text-slate-400 py-1">
                {h}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((iso, i) => {
              if (!iso) {
                return <div key={`empty-${i}`} />
              }
              const selected = selectedDays.has(iso)
              const weekend = isWeekend(iso)
              const num = dayNum(iso)
              const showMonth = num === 1

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => toggleDay(iso)}
                  className={`flex flex-col items-center justify-center rounded-xl h-14 select-none transition-all active:scale-95 ${
                    selected
                      ? 'bg-amber-100 border-2 border-amber-400 text-amber-900'
                      : weekend
                        ? 'bg-slate-100 border border-slate-200 text-slate-400'
                        : 'bg-slate-50 border border-slate-200 text-slate-400'
                  }`}
                >
                  <span className={`text-base font-bold leading-none ${selected ? 'text-amber-900' : 'text-slate-400'}`}>
                    {num}
                  </span>
                  {showMonth && (
                    <span className="text-[9px] uppercase tracking-wide leading-tight mt-0.5 text-current opacity-70">
                      {monthLabel(iso)}
                    </span>
                  )}
                  <span className={`text-[9px] uppercase tracking-wide leading-tight mt-0.5 font-semibold ${
                    selected ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {selected ? 'vac' : 'des'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Resumen */}
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

      {/* Input oculto con el total real */}
      <input type="hidden" name="total_days" value={totalVacDays} />

      {/* Notas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium text-slate-600">
          Notas <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Comentarios para RH…"
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
          ? 'Enviando…'
          : totalVacDays > 0
            ? `Solicitar ${totalVacDays} día${totalVacDays !== 1 ? 's' : ''} de vacaciones`
            : 'Solicitar vacaciones'}
      </button>
    </form>
  )
}
