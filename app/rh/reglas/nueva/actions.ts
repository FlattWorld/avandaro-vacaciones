'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Subcompany } from '@/lib/supabase/types'

const VALID_SUBCOMPANIES: Subcompany[] = [
  'AOT CRA', 'AOT CTM', 'AOT VILLAS', 'CONFIANZA AOT', 'CONFIANZA DASA', 'CORP',
]

export async function crearRegla(
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const subcompany = formData.get('subcompany')?.toString() as Subcompany
  const yearFrom = parseInt(formData.get('year_from')?.toString() ?? '', 10)
  const yearToRaw = formData.get('year_to')?.toString().trim()
  const yearTo = yearToRaw ? parseInt(yearToRaw, 10) : null
  const daysAssigned = parseInt(formData.get('days_assigned')?.toString() ?? '', 10)
  const expiryMonths = parseInt(formData.get('expiry_months')?.toString() ?? '18', 10)
  const notes = formData.get('notes')?.toString().trim() || null

  if (!VALID_SUBCOMPANIES.includes(subcompany)) return { error: 'Subempresa inválida' }
  if (!yearFrom || yearFrom < 1) return { error: 'Año de inicio inválido' }
  if (yearTo !== null && yearTo < yearFrom) return { error: 'El año final debe ser mayor o igual al inicial' }
  if (!daysAssigned || daysAssigned < 1) return { error: 'Los días asignados deben ser al menos 1' }
  if (!expiryMonths || expiryMonths < 1) return { error: 'Los meses de vencimiento deben ser al menos 1' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: rh } = await supabase
    .from('employees')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!rh) return { error: 'No autorizado' }

  const { error } = await supabase.from('vacation_rules').insert({
    subcompany,
    year_from: yearFrom,
    year_to: yearTo,
    days_assigned: daysAssigned,
    expiry_months: expiryMonths,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: null,
    notes,
    created_by: rh.id,
  })

  if (error) return { error: error.message }

  redirect(`/rh/reglas?subcompany=${encodeURIComponent(subcompany)}`)
}
