import { createClient } from '@/lib/supabase/server'
import type { Subcompany } from '@/lib/supabase/types'

export const metadata = { title: 'Reglas de vacaciones — Panel RH' }

const SUBCOMPANIES: Subcompany[] = [
  'AOT CRA',
  'AOT CTM',
  'AOT VILLAS',
  'CONFIANZA AOT',
  'CONFIANZA DASA',
  'CORP',
]

export default async function ReglasPage({
  searchParams,
}: {
  searchParams: Promise<{ subcompany?: string }>
}) {
  const { subcompany: rawSub = 'AOT CRA' } = await searchParams
  const subcompany = (SUBCOMPANIES.includes(rawSub as Subcompany) ? rawSub : 'AOT CRA') as Subcompany
  const supabase = await createClient()

  const { data: rules } = await supabase
    .from('vacation_rules')
    .select('*')
    .eq('subcompany', subcompany)
    .is('valid_to', null)
    .order('year_from')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Reglas de vacaciones</h1>
        <a
          href={`/rh/reglas/nueva?subcompany=${subcompany}`}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          + Nueva regla
        </a>
      </div>

      {/* Selector de subempresa */}
      <div className="flex flex-wrap gap-2">
        {SUBCOMPANIES.map((sub) => (
          <a
            key={sub}
            href={`/rh/reglas?subcompany=${encodeURIComponent(sub)}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              subcompany === sub
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
            }`}
          >
            {sub}
          </a>
        ))}
      </div>

      {!rules || rules.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          No hay reglas configuradas para {subcompany}.
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-stone-600">Años de servicio</th>
                <th className="text-left px-5 py-3 font-medium text-stone-600">Días asignados</th>
                <th className="text-left px-5 py-3 font-medium text-stone-600 hidden sm:table-cell">Vencimiento</th>
                <th className="text-left px-5 py-3 font-medium text-stone-600 hidden md:table-cell">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-stone-900">
                    {rule.year_to
                      ? `Año ${rule.year_from} – ${rule.year_to}`
                      : `Año ${rule.year_from}+`}
                  </td>
                  <td className="px-5 py-3 text-stone-900">
                    {rule.days_assigned} días
                  </td>
                  <td className="px-5 py-3 text-stone-600 hidden sm:table-cell">
                    {rule.expiry_months} meses
                  </td>
                  <td className="px-5 py-3 text-stone-400 text-xs hidden md:table-cell">
                    {rule.notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
