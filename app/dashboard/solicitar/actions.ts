'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function crearSolicitud(formData: FormData) {
  const periodId = formData.get('period_id')?.toString()
  const startDate = formData.get('start_date')?.toString()
  const endDate = formData.get('end_date')?.toString()
  const notes = formData.get('notes')?.toString() || null
  const isAdvance = formData.get('is_advance') === 'true'

  if (!periodId || !startDate || !endDate) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (endDate < startDate) {
    return { error: 'La fecha de fin debe ser posterior a la de inicio' }
  }

  // Calcular días hábiles (días calendario por ahora; se puede refinar)
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name, email')
    .eq('email', user.email!)
    .single()

  if (!employee) return { error: 'Empleado no encontrado' }

  // Verificar que el periodo pertenece al empleado y tiene saldo
  const { data: period } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('id', periodId)
    .eq('employee_id', employee.id)
    .single()

  if (!period) return { error: 'Periodo inválido' }

  const available = period.days_assigned + period.days_bonus - period.days_used
  if (totalDays > available) {
    return { error: `Solo tienes ${available} días disponibles en este periodo` }
  }

  const { error: insertError } = await supabase
    .from('vacation_requests')
    .insert({
      employee_id: employee.id,
      period_id: periodId,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      is_advance: isAdvance,
      notes,
    })

  if (insertError) {
    return { error: 'No se pudo registrar la solicitud. Intenta de nuevo.' }
  }

  // Notificar a RH por email (sin bloquear si falla)
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
          <li><strong>Total:</strong> ${totalDays} días</li>
          ${notes ? `<li><strong>Notas:</strong> ${notes}</li>` : ''}
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/rh/solicitudes">Ver solicitudes pendientes →</a></p>
      `,
    })
  } catch {
    // El email es informativo; no revertir la solicitud si falla
  }

  redirect('/dashboard/historial')
}
