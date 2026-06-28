import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RhSolicitarForm from './form'
import { totalAvailable } from '@/lib/vacation-fifo'

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
  const { data: periods } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', id)
    .gte('expiry_date', today)
    .order('start_date', { ascending: true })

  const available = totalAvailable(periods ?? [])

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <Link href={`/rh/empleados/${id}`} className="text-sm text-slate-400 hover:text-slate-600">
          ← {employee.full_name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Registrar vacaciones</h1>
        <p className="mt-1 text-slate-500 text-sm">
          {employee.full_name} · {employee.subcompany}
        </p>
      </div>

      <RhSolicitarForm employeeId={id} totalAvailable={available} />
    </div>
  )
}
