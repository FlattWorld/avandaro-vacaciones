export type PeriodConsumption = Array<{ period_id: string; days: number }>

export type PeriodForFifo = {
  id: string
  days_assigned: number
  days_bonus: number
  days_used: number
}

export function availableDays(p: PeriodForFifo): number {
  return p.days_assigned + p.days_bonus - p.days_used
}

export function totalAvailable(periods: PeriodForFifo[]): number {
  return periods.reduce((sum, p) => sum + availableDays(p), 0)
}

/** Distribuye `daysNeeded` entre periodos de más viejo a más nuevo.
 *  Los `periods` deben venir ordenados por start_date ASC.
 *  Devuelve null si no hay suficiente saldo. */
export function computeFifo(
  periods: PeriodForFifo[],
  daysNeeded: number
): PeriodConsumption | null {
  const result: PeriodConsumption = []
  let remaining = daysNeeded

  for (const p of periods) {
    if (remaining <= 0) break
    const take = Math.min(remaining, availableDays(p))
    if (take > 0) {
      result.push({ period_id: p.id, days: take })
      remaining -= take
    }
  }

  return remaining > 0 ? null : result
}
