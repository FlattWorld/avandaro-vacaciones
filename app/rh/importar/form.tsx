'use client'

import { useActionState } from 'react'
import { importarEmpleados } from './actions'
import type { ImportResult } from './actions'

const initialState: ImportResult = { imported: 0, errors: [] }

export default function ImportForm() {
  const [state, formAction, pending] = useActionState(importarEmpleados, initialState)

  return (
    <form action={formAction} className="space-y-6">
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <div>
          <label htmlFor="csv" className="block text-sm font-medium text-stone-700">
            Datos de empleados
          </label>
          <p className="text-xs text-stone-400 mt-0.5 mb-2">
            Una línea por empleado:{' '}
            <span className="font-mono bg-stone-100 px-1 rounded">
              Nombre Completo,YYYY-MM-DD,SUBEMPRESA
            </span>
          </p>
          <textarea
            id="csv"
            name="csv"
            rows={14}
            spellCheck={false}
            placeholder={
              '# Líneas con # son comentarios y se ignoran\n' +
              'Juan Pérez García,2015-03-15,AOT CRA\n' +
              'María González López,2020-01-10,AOT CTM\n' +
              'Carlos Ramírez Ortiz,2018-07-22,CORP'
            }
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
          />
        </div>

        <div className="rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 text-xs text-stone-500 space-y-1">
          <p className="font-medium text-stone-600">Subempresas válidas</p>
          <p>AOT CRA · AOT CTM · AOT VILLAS · CONFIANZA AOT · CONFIANZA DASA · CORP</p>
          <p className="mt-1 text-stone-400">
            Los periodos de vacaciones se calculan automáticamente desde el año 1 hasta el año actual.
            El email se puede agregar después, empleado por empleado.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Importando…' : 'Importar empleados'}
        </button>
      </div>

      {(state.imported > 0 || state.errors.length > 0) && (
        <div className="space-y-3">
          {state.imported > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <p className="text-sm font-medium text-green-800">
                {state.imported} empleado{state.imported !== 1 ? 's' : ''} importado
                {state.imported !== 1 ? 's' : ''} correctamente
              </p>
            </div>
          )}
          {state.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 space-y-2">
              <p className="text-sm font-medium text-red-800">
                {state.errors.length} error{state.errors.length !== 1 ? 'es' : ''}:
              </p>
              <ul className="space-y-1.5">
                {state.errors.map((err, idx) => (
                  <li key={idx} className="text-xs text-red-700">
                    {err.line > 0 && <span className="font-medium">Línea {err.line}: </span>}
                    {err.reason}
                    {err.text && (
                      <span className="ml-1 text-red-400 font-mono truncate">({err.text})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
