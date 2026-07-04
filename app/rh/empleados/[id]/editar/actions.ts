'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Subcompany, EmployeeRole } from '@/lib/supabase/types'

const VALID_SUBCOMPANIES: Subcompany[] = [
  'AOT CRA', 'AOT CTM', 'AOT VILLAS', 'CONFIANZA AOT', 'CONFIANZA DASA', 'CORP',
]

export async function actualizarEmpleado(
  employeeId: string,
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const fullName = formData.get('full_name')?.toString().trim()
  const email = formData.get('email')?.toString().trim().toLowerCase() || null
  const subcompany = formData.get('subcompany')?.toString() as Subcompany
  const hireDate = formData.get('hire_date')?.toString()
  const role = formData.get('role')?.toString() as EmployeeRole

  if (!fullName) return { error: 'El nombre es requerido' }
  if (!VALID_SUBCOMPANIES.includes(subcompany)) return { error: 'Subempresa inválida' }
  if (!hireDate || !/^\d{4}-\d{2}-\d{2}$/.test(hireDate)) return { error: 'Fecha de ingreso inválida' }
  if (role !== 'empleado' && role !== 'rh') return { error: 'Rol inválido' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('employees')
    .update({ full_name: fullName, email, subcompany, hire_date: hireDate, role })
    .eq('id', employeeId)

  if (error) return { error: error.message }

  redirect(`/rh/empleados/${employeeId}`)
}

export async function agregarDiasBonus(
  employeeId: string,
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const periodId = formData.get('period_id')?.toString()
  const days = parseInt(formData.get('days')?.toString() ?? '', 10)

  if (!periodId) return { error: 'Selecciona un periodo' }
  if (isNaN(days) || days === 0) return { error: 'Ingresa un número de días distinto de cero' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: period } = await supabase
    .from('vacation_periods')
    .select('days_bonus')
    .eq('id', periodId)
    .single()

  if (!period) return { error: 'Periodo no encontrado' }

  const newBonus = period.days_bonus + days
  if (newBonus < 0) return { error: 'El total de días bonus no puede quedar negativo' }

  const { error } = await supabase
    .from('vacation_periods')
    .update({ days_bonus: newBonus })
    .eq('id', periodId)

  if (error) return { error: error.message }

  redirect(`/rh/empleados/${employeeId}`)
}

export async function eliminarEmpleado(
  employeeId: string,
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const confirmation = formData.get('confirmation')?.toString()
  if (confirmation !== 'ELIMINAR') return { error: 'Escribe ELIMINAR para confirmar' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', employeeId)

  if (error) return { error: error.message }

  redirect('/rh/empleados')
}
