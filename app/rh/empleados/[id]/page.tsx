import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function EmpleadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (!employee) notFound()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: periods }, { data: requests }] = await Promise.all([
    supabase
      .from('vacation_periods')
      .select('*')
      .eq('employee_id', id)
      .order('period_year', { ascending: false }),
    supabase
      .from('vacation_requests')
      .select('*')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/rh/empleados" className="text-sm text-slate-400 hover:text-slate-600">
            ← Empleados
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{employee.full_name}</h1>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="text-sm text-slate-500">{employee.subcompany}</span>
            <span className="text-sm text-slate-500">
              Ingreso{' '}
              {new Date(employee.hire_date + 'T00:00:00').toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {employee.email ? (
              <span className="text-sm text-slate-500">{employee.email}</span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Sin correo
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/rh/empleados/${id}/editar`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Editar
          </Link>
          <Link
            href={`/rh/empleados/${id}/solicitar`}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Solicitar vacaciones
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Saldos por periodo</h2>
        {!periods || periods.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Sin periodos. Los periodos se generan al importar empleados desde el{' '}
            <Link href="/rh/importar" className="text-amber-600 hover:underline">
              importador
            </Link>.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Periodo</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Asig.</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Usados</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Disp.</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Vence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((p) => {
                  const available = p.days_assigned + p.days_bonus - p.days_used
                  const expired = p.expiry_date < today
                  return (
                    <tr key={p.id} className={expired ? 'opacity-40' : ''}>
                      <td className="px-5 py-3">
                        <span className="font-medium text-slate-900">Año {p.period_year}</span>
                        {p.days_bonus > 0 && (
                          <span className="ml-2 text-xs text-green-600">+{p.days_bonus} bonus</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{p.days_assigned + p.days_bonus}</td>
                      <td className="px-5 py-3 text-slate-600">{p.days_used}</td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${available > 0 && !expired ? 'text-slate-900' : 'text-slate-400'}`}>
                          {available}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {new Date(p.expiry_date + 'T00:00:00').toLocaleDateString('es-MX', {
                          month: 'short',
                          year: 'numeric',
                        })}
                        {expired && ' · vencido'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {requests && requests.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Historial de solicitudes</h2>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    {formatDate(req.start_date)} → {formatDate(req.end_date)}
                    <span className="ml-2 font-medium">{req.total_days} días</span>
                  </p>
                  {req.notes && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">"{req.notes}"</p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    req.status === 'aprobada'
                      ? 'bg-green-100 text-green-700'
                      : req.status === 'rechazada'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
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
