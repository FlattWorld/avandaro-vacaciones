// Tipos generados manualmente a partir del schema SQL.
// Cuando tengas la CLI de Supabase configurada, reemplaza con:
//   npx supabase gen types typescript --project-id TU_PROJECT_ID > lib/supabase/types.ts

export type EmployeeRole = 'empleado' | 'rh'
export type Subcompany =
  | 'AOT CRA'
  | 'AOT CTM'
  | 'AOT VILLAS'
  | 'CONFIANZA AOT'
  | 'CONFIANZA DASA'
  | 'CORP'
export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada'

// Tipos de fila — deben ser `type` (no `interface`) para satisfacer Record<string, unknown>
// Los `interface` en TypeScript strict no extienden automáticamente tipos indexados.

export type Employee = {
  id: string
  email: string | null
  full_name: string
  role: EmployeeRole
  subcompany: Subcompany
  hire_date: string
  created_at: string
}

export type VacationPeriod = {
  id: string
  employee_id: string
  period_year: number
  start_date: string
  expiry_date: string
  days_assigned: number
  days_bonus: number
  days_used: number
  is_advance: boolean
  created_at: string
}

export type VacationRequest = {
  id: string
  employee_id: string
  period_id: string
  start_date: string
  end_date: string
  total_days: number
  status: RequestStatus
  is_advance: boolean
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  submitted_by: string | null
  created_at: string
}

export type VacationRule = {
  id: string
  subcompany: Subcompany
  year_from: number
  year_to: number | null
  days_assigned: number
  expiry_months: number
  valid_from: string
  valid_to: string | null
  created_by: string
  notes: string | null
  created_at: string
}

// Tipo helper: saldo disponible de un periodo
export type PeriodBalance = VacationPeriod & {
  days_available: number  // days_assigned + days_bonus - days_used
}

// Tipos para joins frecuentes
export type VacationRequestWithEmployee = VacationRequest & {
  employee: Pick<Employee, 'id' | 'full_name' | 'email' | 'subcompany'>
}

export type VacationRequestWithPeriod = VacationRequest & {
  vacation_period: VacationPeriod
}

// Tipo para la respuesta de Database (requerido por @supabase/ssr y @supabase/supabase-js)
// Cada tabla necesita:
//   - Row / Insert / Update: deben extender Record<string, unknown> → usar `type`, no `interface`
//   - Relationships: GenericRelationship[] → array vacío es válido
export type Database = {
  public: {
    Tables: {
      employees: {
        Row: Employee
        Insert: Omit<Employee, 'id' | 'created_at' | 'email'> & { email?: string | null }
        Update: Partial<Omit<Employee, 'id' | 'created_at'>>
        Relationships: []
      }
      vacation_periods: {
        Row: VacationPeriod
        Insert: Omit<VacationPeriod, 'id' | 'created_at'>
        Update: Partial<Omit<VacationPeriod, 'id' | 'created_at'>>
        Relationships: []
      }
      vacation_requests: {
        Row: VacationRequest
        Insert: {
          employee_id: string
          period_id: string
          start_date: string
          end_date: string
          total_days: number
          is_advance?: boolean
          notes?: string | null
          status?: RequestStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          submitted_by?: string | null
        }
        Update: Partial<Omit<VacationRequest, 'id' | 'created_at'>>
        Relationships: []
      }
      vacation_rules: {
        Row: VacationRule
        Insert: Omit<VacationRule, 'id' | 'created_at'>
        Update: Partial<Omit<VacationRule, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      check_employee_email: {
        Args: { p_email: string }
        Returns: boolean
      }
    }
    Enums: {
      employee_role: EmployeeRole
      subcompany: Subcompany
      request_status: RequestStatus
    }
  }
}
