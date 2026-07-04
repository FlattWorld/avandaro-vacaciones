'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { solicitarCancelacion } from './actions'

type Props = {
  requestId: string
  startDate: string
  endDate: string
  totalDays: number
}

export function CancelRequestButton({ requestId, startDate, endDate, totalDays }: Props) {
  const [open, setOpen] = useState(false)
  const action = solicitarCancelacion.bind(null, requestId)
  const [state, formAction, pending] = useActionState(action, { error: '', sent: false })

  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
      >
        Cancelar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          onClick={() => { if (!state.sent && !pending) setOpen(false) }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {state.sent ? (
              <>
                <div className="text-center space-y-2">
                  <p className="text-base font-semibold text-slate-900">Mensaje enviado a RH</p>
                  <p className="text-sm text-slate-500">
                    RH fue notificado de tu solicitud de cancelación y se pondrá en contacto contigo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-900">Cancelar solicitud</p>
                  <p className="text-sm text-slate-500">
                    Las solicitudes solo pueden cancelarse a través de RH. Podemos enviarles un mensaje con tu petición.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {fmt(startDate)} → {fmt(endDate)}
                  <span className="ml-2 font-medium">{totalDays} días</span>
                </div>

                <form action={formAction} className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
                      Motivo{' '}
                      <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={3}
                      placeholder="¿Por qué quieres cancelar?"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  {state.error && (
                    <p className="text-sm text-red-600" role="alert">{state.error}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {pending ? 'Enviando…' : 'Notificar a RH'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      Volver
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
