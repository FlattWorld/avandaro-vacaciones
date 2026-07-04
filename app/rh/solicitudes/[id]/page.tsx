import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReviewActions from './review-actions'

export const metadata = { title: 'Revisar solicitud — Panel RH' }

export default async function SolicitudDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: request } = await supabase
    .from('vacation_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!request) notFound()

  const { data: employee } = await supabase
    .from('employees')
    .select('full_name, email, subcompany')
    .eq('id', request.employee_id)
    .single()

  const consumption = request.period_consumption as Array<{ period_id: string; days: number }> | null
  const periodIds = consumption?.map((c) => c.period_id) ?? []

  let periodYears: Record<string, number> = {}
  if (periodIds.length > 0) {
    const { data: periodRows } = await supabase
      .from('vacation_periods')
      .select('id, period_year')
      .in('id', periodIds)

    if (periodRows) {
      periodYears = Object.fromEntries(periodRows.map((p) => [p.id, p.period_year]))
    }
  }

  const statusColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/rh/solicitudes" className="text-sm text-slate-400 hover:text-slate-600">
          ← Solicitudes
        </Link>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">Solicitud de vacaciones</h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[request.status]}`}>
            {request.status}
          </span>
        </div>
      </div>

      {/* Empleado */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Empleado</p>
        <p className="text-base font-semibold text-slate-900">{employee?.full_name ?? '—'}</p>
        <p className="text-sm text-slate-500">{employee?.subcompany}</p>
        {employee?.email && (
          <p className="text-sm text-slate-400">{employee.email}</p>
        )}
      </div>

      {/* Fechas y días */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Periodo solicitado</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="text-base font-semibold text-slate-900">
            {formatDate(request.start_date)} → {formatDate(request.end_date)}
          </p>
          <span className="text-lg font-bold text-amber-700">{request.total_days} días</span>
        </div>
        {request.notes && (
          <p className="text-sm text-slate-500 italic">"{request.notes}"</p>
        )}
        <p className="text-xs text-slate-400">
          Solicitado el {formatDateTime(request.created_at)}
        </p>
      </div>

      {/* Distribución FIFO */}
      {consumption && consumption.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Distribución de días</p>
          <div className="space-y-1">
            {consumption.map(({ period_id, days }) => (
              <div key={period_id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {periodYears[period_id] ? `Año ${periodYears[period_id]}` : '—'}
                </span>
                <span className="font-medium text-slate-900">{days} días</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisión ya tomada */}
      {request.status !== 'pendiente' && (
        <div
          className={`rounded-xl border p-5 space-y-1 ${
            request.status === 'aprobada'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              request.status === 'aprobada' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {request.status === 'aprobada' ? 'Solicitud aprobada' : 'Solicitud rechazada'}
          </p>
          {request.reviewed_at && (
            <p className={`text-xs ${request.status === 'aprobada' ? 'text-green-600' : 'text-red-600'}`}>
              {formatDateTime(request.reviewed_at)}
            </p>
          )}
          {request.rejection_reason && (
            <p className="text-sm text-red-700 mt-1">Motivo: {request.rejection_reason}</p>
          )}
        </div>
      )}

      {/* Acciones */}
      {request.status === 'pendiente' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Decisión</p>
          <ReviewActions requestId={request.id} />
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
