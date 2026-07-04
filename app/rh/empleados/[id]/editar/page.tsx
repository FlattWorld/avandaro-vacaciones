import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EditInfoForm, BonusDaysForm, DeleteForm } from './forms'

export const metadata = { title: 'Editar empleado — Panel RH' }

export default async function EditarEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: employee }, { data: periods }] = await Promise.all([
    supabase.from('employees').select('*').eq('id', id).single(),
    supabase
      .from('vacation_periods')
      .select('*')
      .eq('employee_id', id)
      .order('period_year', { ascending: false }),
  ])

  if (!employee) notFound()

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href={`/rh/empleados/${id}`} className="text-sm text-slate-400 hover:text-slate-600">
          ← {employee.full_name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Editar empleado</h1>
      </div>

      {/* Datos del empleado */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Datos</h2>
        <EditInfoForm employee={employee} />
      </section>

      {/* Días bonus por periodo */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Días adicionales</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Agrega o quita días de un periodo específico. Los días respetan la fecha de vencimiento del periodo.
          </p>
        </div>

        {/* Tabla de periodos */}
        {periods && periods.length > 0 && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Periodo</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Asig.</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Bonus</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Usados</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Disp.</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600 hidden sm:table-cell">Vence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(periods ?? []).map((p) => {
                  const available = p.days_assigned + p.days_bonus - p.days_used
                  const today = new Date().toISOString().split('T')[0]
                  const expired = p.expiry_date < today
                  return (
                    <tr key={p.id} className={expired ? 'opacity-40' : ''}>
                      <td className="px-4 py-2.5 font-medium text-slate-900">Año {p.period_year}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.days_assigned}</td>
                      <td className="px-4 py-2.5">
                        <span className={p.days_bonus > 0 ? 'text-green-600 font-medium' : 'text-slate-400'}>
                          {p.days_bonus > 0 ? `+${p.days_bonus}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{p.days_used}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{available}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">
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

        <BonusDaysForm employeeId={id} periods={periods ?? []} />
      </section>

      {/* Zona de peligro */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Zona de peligro</h2>
        <DeleteForm employeeId={id} employeeName={employee.full_name} />
      </section>
    </div>
  )
}
