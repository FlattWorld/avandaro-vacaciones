'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function crearSolicitudPorRH(
  employeeId: string,
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const periodId = formData.get('period_id')?.toString()
  const startDate = formData.get('start_date')?.toString()
  const endDate = formData.get('end_date')?.toString()
  const notes = formData.get('notes')?.toString() || null

  if (!periodId || !startDate || !endDate) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (endDate < startDate) {
    return { error: 'La fecha de fin debe ser posterior a la de inicio' }
  }

  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: rhEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!rhEmployee) return { error: 'Error de autorización' }

  const { data: period } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('id', periodId)
    .eq('employee_id', employeeId)
    .single()

  if (!period) return { error: 'Periodo inválido' }

  const available = period.days_assigned + period.days_bonus - period.days_used
  if (totalDays > available) {
    return { error: `Solo hay ${available} días disponibles en este periodo` }
  }

  const { error: insertError } = await supabase.from('vacation_requests').insert({
    employee_id: employeeId,
    period_id: periodId,
    start_date: startDate,
    end_date: endDate,
    total_days: totalDays,
    is_advance: false,
    notes,
    status: 'aprobada',
    submitted_by: rhEmployee.id,
    reviewed_by: rhEmployee.id,
    reviewed_at: new Date().toISOString(),
  })

  if (insertError) {
    return { error: 'No se pudo registrar la solicitud. Intenta de nuevo.' }
  }

  redirect(`/rh/empleados/${employeeId}`)
}
