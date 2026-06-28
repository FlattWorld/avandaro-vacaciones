'use server'

import { createClient } from '@/lib/supabase/server'
import type { Subcompany } from '@/lib/supabase/types'

const VALID_SUBCOMPANIES: Subcompany[] = [
  'AOT CRA',
  'AOT CTM',
  'AOT VILLAS',
  'CONFIANZA AOT',
  'CONFIANZA DASA',
  'CORP',
]

export type ImportResult = {
  imported: number
  errors: Array<{ line: number; text: string; reason: string }>
}

// Días base si no existe regla en la BD (escala legal federal + acuerdo CTM)
function defaultDays(year: number, subcompany: Subcompany): number {
  if (year === 1) return 12
  const base = year <= 4 ? 14 : year <= 9 ? 16 : 18
  return subcompany === 'AOT CTM' ? base + 1 : base
}

export async function importarEmpleados(
  _prev: ImportResult,
  formData: FormData
): Promise<ImportResult> {
  const csv = formData.get('csv')?.toString().trim() ?? ''
  const lines = csv
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { imported: 0, errors: [{ line: 0, text: '', reason: 'No autenticado' }] }
  }

  // Cargar todas las reglas vigentes de una vez
  const { data: rules } = await supabase
    .from('vacation_rules')
    .select('*')
    .is('valid_to', null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let imported = 0
  const errors: ImportResult['errors'] = []

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const text = lines[i]
    const parts = text.split(',').map((p) => p.trim())

    if (parts.length < 3) {
      errors.push({ line: lineNum, text, reason: 'Formato inválido — se esperan 3 columnas: Nombre,YYYY-MM-DD,SUBEMPRESA' })
      continue
    }

    const [fullName, hireDateStr, subcompanyRaw] = parts
    const subcompany = subcompanyRaw.toUpperCase() as Subcompany

    if (!fullName) {
      errors.push({ line: lineNum, text, reason: 'Nombre vacío' })
      continue
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(hireDateStr)) {
      errors.push({ line: lineNum, text, reason: `Fecha inválida "${hireDateStr}" — usar formato YYYY-MM-DD` })
      continue
    }

    if (!VALID_SUBCOMPANIES.includes(subcompany)) {
      errors.push({
        line: lineNum,
        text,
        reason: `Subempresa inválida "${subcompanyRaw}" — válidas: ${VALID_SUBCOMPANIES.join(', ')}`,
      })
      continue
    }

    const hireDate = new Date(hireDateStr + 'T00:00:00')
    if (isNaN(hireDate.getTime()) || hireDate > today) {
      errors.push({ line: lineNum, text, reason: 'Fecha de ingreso inválida o futura' })
      continue
    }

    // Insertar empleado (sin email por ahora)
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .insert({ full_name: fullName, hire_date: hireDateStr, subcompany, role: 'empleado' })
      .select('id')
      .single()

    if (empError || !employee) {
      errors.push({ line: lineNum, text, reason: `Error al insertar: ${empError?.message ?? 'desconocido'}` })
      continue
    }

    // Calcular y crear periodos de vacaciones desde el año 1 hasta el actual
    const subRules = (rules ?? []).filter((r) => r.subcompany === subcompany)
    const periods: Array<{
      employee_id: string
      period_year: number
      start_date: string
      expiry_date: string
      days_assigned: number
      days_bonus: number
      days_used: number
      is_advance: boolean
    }> = []

    let year = 1
    while (true) {
      // Aniversario del año (year-1): año 1 = fecha de ingreso, año 2 = primer aniversario, etc.
      const startDate = new Date(hireDate)
      startDate.setFullYear(hireDate.getFullYear() + (year - 1))

      if (startDate > today) break

      const rule = subRules.find((r) => r.year_from <= year && (r.year_to === null || r.year_to >= year))
      const daysAssigned = rule?.days_assigned ?? defaultDays(year, subcompany)
      const expiryMonths = rule?.expiry_months ?? 18

      const expiryDate = new Date(startDate)
      expiryDate.setMonth(startDate.getMonth() + expiryMonths)

      periods.push({
        employee_id: employee.id,
        period_year: year,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        days_assigned: daysAssigned,
        days_bonus: 0,
        days_used: 0,
        is_advance: false,
      })

      year++
    }

    if (periods.length > 0) {
      const { error: periodsError } = await supabase.from('vacation_periods').insert(periods)
      if (periodsError) {
        errors.push({
          line: lineNum,
          text,
          reason: `Empleado creado pero error en periodos: ${periodsError.message}`,
        })
      }
    }

    imported++
  }

  return { imported, errors }
}
