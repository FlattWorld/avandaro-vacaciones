import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SolicitarForm from './solicitar-form'
import type { PeriodBalance } from '@/lib/supabase/types'

export const metadata = { title: 'Solicitar días — Vacaciones Avándaro' }

export default async function SolicitarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('email', user.email!)
    .single()

  if (!employee) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const { data: periods } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('expiry_date', today)
    .order('period_year')

  const periodsWithBalance: PeriodBalance[] = (periods ?? [])
    .map((p) => ({
      ...p,
      days_available: p.days_assigned + p.days_bonus - p.days_used,
    }))
    .filter((p) => p.days_available > 0)

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Solicitar días</h1>
        <p className="mt-1 text-stone-500 text-sm">
          Las solicitudes quedan pendientes de aprobación por RH.
        </p>
      </div>

      {periodsWithBalance.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          No tienes días disponibles en ningún periodo activo.
        </div>
      ) : (
        <SolicitarForm periods={periodsWithBalance} employeeId={employee.id} />
      )}
    </div>
  )
}
