import { createClient } from '@/lib/supabase/server'
import type { RequestStatus, VacationRequest, Employee, VacationPeriod } from '@/lib/supabase/types'

export const metadata = { title: 'Solicitudes — Panel RH' }

const VALID_STATUS: RequestStatus[] = ['pendiente', 'aprobada', 'rechazada']

type RequestRow = VacationRequest & {
  employee: Pick<Employee, 'id' | 'full_name' | 'email' | 'subcompany'> | null
  vacation_period: Pick<VacationPeriod, 'period_year' | 'days_assigned' | 'days_bonus' | 'days_used'> | null
}

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: rawStatus = 'pendiente' } = await searchParams
  const status = (VALID_STATUS.includes(rawStatus as RequestStatus) ? rawStatus : 'pendiente') as RequestStatus
  const supabase = await createClient()

  // Dos queries separadas para evitar joins sin Relationships tipadas
  const { data: rawRequests } = await supabase
    .from('vacation_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  const requests = rawRequests as RequestRow[] | null

  const statusTabs = [
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobada', label: 'Aprobadas' },
    { value: 'rechazada', label: 'Rechazadas' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Solicitudes</h1>

      {/* Tabs de estado */}
      <div className="flex gap-1 border-b border-stone-200">
        {statusTabs.map((tab) => (
          <a
            key={tab.value}
            href={`/rh/solicitudes?status=${tab.value}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              status === tab.value
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          No hay solicitudes {status === 'pendiente' ? 'pendientes' : status === 'aprobada' ? 'aprobadas' : 'rechazadas'}.
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100 overflow-hidden">
          {requests.map((req) => (
            <RequestRow key={req.id} request={req as any} />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestRow({ request }: { request: any }) {
  const statusColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
  }

  return (
    <div className="flex items-start justify-between px-5 py-4 gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-stone-900">
            {request.employee?.full_name}
          </p>
          <span className="text-xs text-stone-400">{request.employee?.subcompany}</span>
          {request.is_advance && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              anticipo
            </span>
          )}
        </div>
        <p className="text-sm text-stone-600 mt-0.5">
          {formatDate(request.start_date)} → {formatDate(request.end_date)}
          <span className="ml-2 font-medium">{request.total_days} días</span>
        </p>
        {request.notes && (
          <p className="text-xs text-stone-400 mt-1 italic">"{request.notes}"</p>
        )}
        {request.rejection_reason && (
          <p className="text-xs text-red-400 mt-1">Motivo: {request.rejection_reason}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            statusColors[request.status]
          }`}
        >
          {request.status}
        </span>
        {request.status === 'pendiente' && (
          <a
            href={`/rh/solicitudes/${request.id}`}
            className="text-xs text-amber-600 hover:underline"
          >
            Revisar →
          </a>
        )}
        <span className="text-xs text-stone-400">
          {formatDate(request.created_at)}
        </span>
      </div>
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
