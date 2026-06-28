import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { VacationRequest } from '@/lib/supabase/types'

export const metadata = { title: 'Historial — Vacaciones Avándaro' }

type RequestWithPeriod = VacationRequest & {
  vacation_period: { period_year: number } | null
}

export default async function HistorialPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!employee) redirect('/login')

  // Dos queries separadas para evitar depender de Relationships tipadas
  const { data: requests } = await supabase
    .from('vacation_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  const periodIds = [...new Set((requests ?? []).map((r) => r.period_id))]

  const { data: periods } = periodIds.length
    ? await supabase
        .from('vacation_periods')
        .select('id, period_year')
        .in('id', periodIds)
    : { data: [] }

  const periodMap = Object.fromEntries(
    (periods ?? []).map((p) => [p.id, p.period_year])
  )

  const enrichedRequests: RequestWithPeriod[] = (requests ?? []).map((r) => ({
    ...r,
    vacation_period: { period_year: periodMap[r.period_id] ?? 0 },
  }))

  const statusColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Historial de solicitudes</h1>

      {enrichedRequests.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          No tienes solicitudes registradas.
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100 overflow-hidden">
          {enrichedRequests.map((req) => (
            <div key={req.id} className="flex items-start justify-between px-5 py-4 gap-4">
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {formatDate(req.start_date)} → {formatDate(req.end_date)}
                  <span className="ml-2 text-stone-600">{req.total_days} días</span>
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Periodo año {req.vacation_period?.period_year} ·{' '}
                  Solicitado el {formatDate(req.created_at)}
                </p>
                {req.rejection_reason && (
                  <p className="text-xs text-red-500 mt-1">
                    Motivo de rechazo: {req.rejection_reason}
                  </p>
                )}
                {req.notes && (
                  <p className="text-xs text-stone-400 mt-1 italic">"{req.notes}"</p>
                )}
              </div>
              <span
                className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  statusColors[req.status]
                }`}
              >
                {req.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
