'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sendOtpEmail(formData: FormData) {
  const email = formData.get('email')?.toString().trim().toLowerCase()

  if (!email) return { error: 'El correo es requerido' }

  const supabase = await createClient()

  // Verificar que el email existe en employees usando función SECURITY DEFINER
  // (las políticas RLS bloquean SELECT sin sesión activa)
  const { data: isEmployee } = await supabase
    .rpc('check_employee_email', { p_email: email })

  if (!isEmployee) {
    return { error: 'Este correo no está registrado en el sistema' }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: 'No se pudo enviar el correo. Intenta de nuevo.' }
  }

  redirect(`/login/sent?email=${encodeURIComponent(email)}`)
}

export async function verifyOtp(formData: FormData) {
  const email = formData.get('email')?.toString()
  const token = formData.get('token')?.toString().trim()

  if (!email || !token) return { error: 'Datos incompletos' }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { error: 'Código incorrecto o expirado' }
  }

  redirect('/')
}
