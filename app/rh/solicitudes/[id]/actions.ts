'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmployeeEmail(
  employeeEmail: string,
  employeeName: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  status: 'aprobada' | 'rechazada',
  rejectionReason?: string
) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const subject =
    status === 'aprobada'
      ? 'Tu solicitud de vacaciones fue aprobada'
      : 'Tu solicitud de vacaciones fue rechazada'

  const body =
    status === 'aprobada'
      ? `<p>Hola ${employeeName.split(' ')[0]},</p>
         <p>Tu solicitud de vacaciones ha sido <strong>aprobada</strong>.</p>
         <ul>
           <li><strong>Del:</strong> ${fmt(startDate)}</li>
           <li><strong>Al:</strong> ${fmt(endDate)}</li>
           <li><strong>Días de vacaciones:</strong> ${totalDays}</li>
         </ul>
         <p>¡Que las disfrutes!</p>`
      : `<p>Hola ${employeeName.split(' ')[0]},</p>
         <p>Tu solicitud de vacaciones ha sido <strong>rechazada</strong>.</p>
         <ul>
           <li><strong>Del:</strong> ${fmt(startDate)}</li>
           <li><strong>Al:</strong> ${fmt(endDate)}</li>
           <li><strong>Días solicitados:</strong> ${totalDays}</li>
           ${rejectionReason ? `<li><strong>Motivo:</strong> ${rejectionReason}</li>` : ''}
         </ul>
         <p>Si tienes dudas, comunícate con RH.</p>`

  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: employeeEmail,
    subject,
    html: body,
  })
}

export async function aprobarSolicitud(
  requestId: string,
  _prev: { error: string },
  _formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: rh } = await supabase
    .from('employees')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!rh) return { error: 'No autorizado' }

  const { data: request } = await supabase
    .from('vacation_requests')
    .select('employee_id, start_date, end_date, total_days, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Solicitud no encontrada' }
  if (request.status !== 'pendiente') return { error: 'La solicitud ya fue procesada' }

  const { error } = await supabase
    .from('vacation_requests')
    .update({
      status: 'aprobada',
      reviewed_by: rh.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  const { data: employee } = await supabase
    .from('employees')
    .select('full_name, email')
    .eq('id', request.employee_id)
    .single()

  if (employee?.email) {
    try {
      await sendEmployeeEmail(
        employee.email,
        employee.full_name,
        request.start_date,
        request.end_date,
        request.total_days,
        'aprobada'
      )
    } catch {
      // No bloqueante
    }
  }

  redirect('/rh/solicitudes')
}

export async function rechazarSolicitud(
  requestId: string,
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const reason = formData.get('rejection_reason')?.toString().trim()
  if (!reason) return { error: 'El motivo del rechazo es requerido' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: rh } = await supabase
    .from('employees')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!rh) return { error: 'No autorizado' }

  const { data: request } = await supabase
    .from('vacation_requests')
    .select('period_consumption, status, employee_id, start_date, end_date, total_days')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Solicitud no encontrada' }
  if (request.status !== 'pendiente') return { error: 'La solicitud ya fue procesada' }

  const { error } = await supabase
    .from('vacation_requests')
    .update({
      status: 'rechazada',
      reviewed_by: rh.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  const consumption = request.period_consumption as Array<{ period_id: string; days: number }> | null
  if (consumption) {
    for (const { period_id, days } of consumption) {
      const { data: period } = await supabase
        .from('vacation_periods')
        .select('days_used')
        .eq('id', period_id)
        .single()

      if (period) {
        await supabase
          .from('vacation_periods')
          .update({ days_used: Math.max(0, period.days_used - days) })
          .eq('id', period_id)
      }
    }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('full_name, email')
    .eq('id', request.employee_id)
    .single()

  if (employee?.email) {
    try {
      await sendEmployeeEmail(
        employee.email,
        employee.full_name,
        request.start_date,
        request.end_date,
        request.total_days,
        'rechazada',
        reason
      )
    } catch {
      // No bloqueante
    }
  }

  redirect('/rh/solicitudes')
}
