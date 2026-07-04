'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { computeFifo, totalAvailable } from '@/lib/vacation-fifo'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function crearSolicitud(formData: FormData) {
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

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name, email')
    .eq('email', user.email!)
    .single()

  if (!employee) return { error: 'Empleado no encontrado' }

  // Verificar traslape con solicitudes existentes (pendientes o aprobadas)
  const { data: overlapping } = await supabase
    .from('vacation_requests')
    .select('start_date, end_date')
    .eq('employee_id', employee.id)
    .neq('status', 'rechazada')
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .limit(1)

  if (overlapping && overlapping.length > 0) {
    const ex = overlapping[0]
    return { error: `Ya tienes una solicitud del ${fmtDate(ex.start_date)} al ${fmtDate(ex.end_date)} que se traslapa con las fechas seleccionadas` }
  }

  const today = new Date().toISOString().split('T')[0]
  const { data: rawPeriods } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('expiry_date', today)
    .order('start_date', { ascending: true })

  const periods = rawPeriods ?? []
  const available = totalAvailable(periods)

  if (totalDays > available) {
    return { error: `Solo tienes ${available} día${available !== 1 ? 's' : ''} disponibles` }
  }

  const consumption = computeFifo(periods, totalDays)
  if (!consumption) {
    return { error: `Solo tienes ${available} días disponibles` }
  }

  // Insertar la solicitud primero
  const { error: insertError } = await supabase.from('vacation_requests').insert({
    employee_id: employee.id,
    period_id: consumption[0].period_id,
    start_date: startDate,
    end_date: endDate,
    total_days: totalDays,
    notes,
    period_consumption: consumption,
  })

  if (insertError) {
    console.error('[solicitar] insert error:', insertError.message, insertError.details)
    return { error: `[debug] ${insertError.message}` }
  }

  // Descontar días de cada periodo (FIFO)
  for (const { period_id, days } of consumption) {
    const period = periods.find((p) => p.id === period_id)!
    await supabase
      .from('vacation_periods')
      .update({ days_used: period.days_used + days })
      .eq('id', period_id)
  }

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: process.env.RH_EMAIL!,
      subject: `Nueva solicitud de vacaciones — ${employee.full_name}`,
      html: `
        <p><strong>${employee.full_name}</strong> solicitó vacaciones:</p>
        <ul>
          <li><strong>Del:</strong> ${startDate}</li>
          <li><strong>Al:</strong> ${endDate}</li>
          <li><strong>Días de vacaciones:</strong> ${totalDays}</li>
          ${notes ? `<li><strong>Notas:</strong> ${notes}</li>` : ''}
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/rh/solicitudes">Ver solicitudes pendientes →</a></p>
      `,
    })
  } catch {
    // No bloqueante
  }

  redirect('/dashboard/historial')
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
