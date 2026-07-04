'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function solicitarCancelacion(
  requestId: string,
  _prev: { error: string; sent: boolean },
  formData: FormData
): Promise<{ error: string; sent: boolean }> {
  const reason = formData.get('reason')?.toString().trim() || null

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', sent: false }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('email', user.email!)
    .single()

  if (!employee) return { error: 'Empleado no encontrado', sent: false }

  const { data: request } = await supabase
    .from('vacation_requests')
    .select('start_date, end_date, total_days, status')
    .eq('id', requestId)
    .eq('employee_id', employee.id)
    .single()

  if (!request) return { error: 'Solicitud no encontrada', sent: false }
  if (request.status !== 'pendiente') return { error: 'Esta solicitud ya no está pendiente', sent: false }

  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: process.env.RH_EMAIL!,
      subject: `Solicitud de cancelación de vacaciones — ${employee.full_name}`,
      html: `
        <p><strong>${employee.full_name}</strong> solicita cancelar sus vacaciones:</p>
        <ul>
          <li><strong>Del:</strong> ${fmt(request.start_date)}</li>
          <li><strong>Al:</strong> ${fmt(request.end_date)}</li>
          <li><strong>Días:</strong> ${request.total_days}</li>
          ${reason ? `<li><strong>Motivo:</strong> ${reason}</li>` : ''}
        </ul>
        <p>Para cancelarla, rechaza la solicitud desde el panel de RH:</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/rh/solicitudes">Ver solicitudes pendientes →</a></p>
      `,
    })
  } catch {
    return { error: 'No se pudo enviar el correo. Intenta de nuevo.', sent: false }
  }

  return { error: '', sent: true }
}
