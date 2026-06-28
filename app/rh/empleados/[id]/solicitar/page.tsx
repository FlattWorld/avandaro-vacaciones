import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RhSolicitarForm from './form'
import type { PeriodBalance } from '@/lib/supabase/types'

export default async function RhSolicitarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name, subcompany')
    .eq('id', id)
    .single()

  if (!employee) notFound()

  const today = new Date().toISOString().split('T')[0]

  const { data: rawPeriods } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', id)
    .gt('expiry_date', today)
    .order('period_year')

  const periods: PeriodBalance[] = (rawPeriods ?? [])
    .map((p) => ({ ...p, days_available: p.days_assigned + p.days_bonus - p.days_used }))
    .filter((p) => p.days_available > 0)

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/rh/empleados/${id}`} className="text-sm text-stone-400 hover:text-stone-600">
          ← {employee.full_name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Registrar vacaciones</h1>
        <p className="mt-1 text-stone-500 text-sm">
          {employee.full_name} · {employee.subcompany}
        </p>
      </div>

      <div className="max-w-lg">
        <RhSolicitarForm employeeId={id} periods={periods} />
      </div>
    </div>
  )
}
