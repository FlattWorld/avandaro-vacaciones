'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeFifo, totalAvailable } from '@/lib/vacation-fifo'

export async function crearSolicitudPorRH(
  employeeId: string,
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const startDate = formData.get('start_date')?.toString()
  const endDate = formData.get('end_date')?.toString()
  const notes = formData.get('notes')?.toString() || null

  if (!startDate || !endDate) {
    return { error: 'Las fechas son requeridas' }
  }

  if (endDate < startDate) {
    return { error: 'La fecha de fin debe ser posterior a la de inicio' }
  }

  const totalDays = parseInt(formData.get('total_days')?.toString() ?? '0', 10)
  if (!totalDays || totalDays < 1) {
    return { error: 'Debes seleccionar al menos un día de vacaciones' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: rhEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!rhEmployee) return { error: 'Error de autorización' }

  // Verificar traslape con solicitudes existentes (pendientes o aprobadas)
  const { data: overlapping } = await supabase
    .from('vacation_requests')
    .select('start_date, end_date')
    .eq('employee_id', employeeId)
    .neq('status', 'rechazada')
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .limit(1)

  if (overlapping && overlapping.length > 0) {
    const ex = overlapping[0]
    return { error: `Ya existe una solicitud del ${fmtDate(ex.start_date)} al ${fmtDate(ex.end_date)} que se traslapa con las fechas seleccionadas` }
  }

  const today = new Date().toISOString().split('T')[0]
  const { data: rawPeriods } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('expiry_date', today)
    .order('start_date', { ascending: true })

  const periods = rawPeriods ?? []
  const available = totalAvailable(periods)

  if (totalDays > available) {
    return { error: `Solo hay ${available} día${available !== 1 ? 's' : ''} disponibles` }
  }

  const consumption = computeFifo(periods, totalDays)
  if (!consumption) {
    return { error: `Solo hay ${available} días disponibles` }
  }

  const { error: insertError } = await supabase.from('vacation_requests').insert({
    employee_id: employeeId,
    period_id: consumption[0].period_id,
    start_date: startDate,
    end_date: endDate,
    total_days: totalDays,
    notes,
    status: 'aprobada',
    submitted_by: rhEmployee.id,
    reviewed_by: rhEmployee.id,
    reviewed_at: new Date().toISOString(),
    period_consumption: consumption,
  })

  if (insertError) {
    console.error('[rh/solicitar] insert error:', insertError.message, insertError.details, insertError.code)
    return { error: `[debug] ${insertError.message}` }
  }

  for (const { period_id, days } of consumption) {
    const period = periods.find((p) => p.id === period_id)!
    await supabase
      .from('vacation_periods')
      .update({ days_used: period.days_used + days })
      .eq('id', period_id)
  }

  redirect(`/rh/empleados/${employeeId}`)
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
