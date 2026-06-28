import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { PeriodBalance } from '@/lib/supabase/types'

export const metadata = { title: 'Mi saldo — Vacaciones Avándaro' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('email', user.email!)
    .single()

  if (!employee) redirect('/login')

  // Obtener periodos vigentes (no expirados) del empleado
  const today = new Date().toISOString().split('T')[0]
  const { data: periods } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('expiry_date', today)
    .order('period_year', { ascending: false })

  const periodsWithBalance: PeriodBalance[] = (periods ?? []).map((p) => ({
    ...p,
    days_available: p.days_assigned + p.days_bonus - p.days_used,
  }))

  const totalAvailable = periodsWithBalance.reduce(
    (sum, p) => sum + p.days_available,
    0
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {employee.full_name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-slate-500 text-sm">{employee.subcompany}</p>
      </div>

      {/* Resumen de saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Días disponibles"
          value={totalAvailable}
          highlight
        />
        <StatCard
          label="Periodos activos"
          value={periodsWithBalance.length}
        />
        <StatCard
          label="Antigüedad"
          value={getYearsLabel(employee.hire_date)}
          isText
        />
      </div>

      {/* Detalle por periodo */}
      {periodsWithBalance.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No tienes periodos de vacaciones activos. Contacta a RH.
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Detalle por periodo
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
            {periodsWithBalance.map((period) => (
              <PeriodRow key={period.id} period={period} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
  isText = false,
}: {
  label: string
  value: number | string
  highlight?: boolean
  isText?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight
          ? 'border-amber-200 bg-amber-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold ${
          highlight ? 'text-amber-700' : 'text-slate-900'
        } ${isText ? 'text-xl' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function PeriodRow({ period }: { period: PeriodBalance }) {
  const expiryDate = new Date(period.expiry_date)
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const isExpiringSoon = daysUntilExpiry <= 60

  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-medium text-slate-900">
          Año {period.period_year}
          {period.is_advance && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              anticipo
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Vence {formatDate(period.expiry_date)}
          {isExpiringSoon && (
            <span className="ml-1 text-amber-600 font-medium">
              · en {daysUntilExpiry} días
            </span>
          )}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-slate-900">
          {period.days_available}
          <span className="text-xs font-normal text-slate-500 ml-1">días</span>
        </p>
        <p className="text-xs text-slate-400">
          {period.days_used} usados / {period.days_assigned + period.days_bonus} totales
        </p>
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getYearsLabel(hireDateStr: string) {
  const hire = new Date(hireDateStr)
  const now = new Date()
  const years = now.getFullYear() - hire.getFullYear()
  const months = now.getMonth() - hire.getMonth()
  const adjustedYears = months < 0 ? years - 1 : years
  return adjustedYears === 1 ? '1 año' : `${adjustedYears} años`
}
