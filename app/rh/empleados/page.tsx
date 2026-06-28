import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Empleados — Panel RH' }

export default async function EmpleadosPage() {
  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('role', 'empleado')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empleados</h1>
          <p className="text-sm text-slate-500">{employees?.length ?? 0} registros</p>
        </div>
        <a
          href="/rh/importar"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Importar desde Excel
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-slate-600">Nombre</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">Subempresa</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">Ingreso</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(employees ?? []).map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">{emp.full_name}</p>
                  <p className="text-slate-400 text-xs">{emp.email ?? 'Sin correo'}</p>
                </td>
                <td className="px-5 py-3 text-slate-600 hidden sm:table-cell">
                  {emp.subcompany}
                </td>
                <td className="px-5 py-3 text-slate-600 hidden md:table-cell">
                  {new Date(emp.hire_date).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-5 py-3 text-right">
                  <a
                    href={`/rh/empleados/${emp.id}`}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    Ver saldo →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
