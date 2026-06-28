import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Panel RH — Vacaciones Avándaro' }

export default async function RhPage() {
  const supabase = await createClient()

  // Contadores para el resumen del panel
  const [{ count: pendientes }, { count: totalEmpleados }] = await Promise.all([
    supabase
      .from('vacation_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendiente'),
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'empleado'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel RH</h1>
        <p className="mt-1 text-slate-500 text-sm">
          Gestión de solicitudes y saldos de vacaciones
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickCard
          href="/rh/solicitudes"
          label="Solicitudes pendientes"
          value={pendientes ?? 0}
          highlight={!!pendientes && pendientes > 0}
          description="Ver y gestionar solicitudes"
        />
        <QuickCard
          href="/rh/empleados"
          label="Empleados"
          value={totalEmpleados ?? 0}
          description="Gestionar saldos y registros"
        />
        <QuickCard
          href="/rh/reglas"
          label="Reglas de vacaciones"
          value="Configurar"
          isText
          description="Días asignados por antigüedad"
        />
      </div>
    </div>
  )
}

function QuickCard({
  href,
  label,
  value,
  description,
  highlight = false,
  isText = false,
}: {
  href: string
  label: string
  value: number | string
  description: string
  highlight?: boolean
  isText?: boolean
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 transition-shadow hover:shadow-md ${
        highlight
          ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`mt-2 font-bold ${
          highlight ? 'text-amber-700' : 'text-slate-900'
        } ${isText ? 'text-xl' : 'text-3xl'}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </Link>
  )
}
