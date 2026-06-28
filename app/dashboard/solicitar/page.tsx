import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SolicitarForm from './solicitar-form'
import { totalAvailable } from '@/lib/vacation-fifo'

export const metadata = { title: 'Solicitar días — Vacaciones Avándaro' }

export default async function SolicitarPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!employee) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const { data: periods } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('expiry_date', today)
    .order('start_date', { ascending: true })

  const available = totalAvailable(periods ?? [])

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Solicitar días</h1>
        <p className="mt-1 text-slate-500 text-sm">
          Las solicitudes quedan pendientes de aprobación por RH.
        </p>
      </div>

      {available === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No tienes días disponibles en ningún periodo activo.
        </div>
      ) : (
        <SolicitarForm totalAvailable={available} />
      )}
    </div>
  )
}
