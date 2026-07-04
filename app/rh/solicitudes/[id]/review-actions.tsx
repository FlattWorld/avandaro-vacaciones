'use client'

import { useActionState } from 'react'
import { aprobarSolicitud, rechazarSolicitud } from './actions'

export default function ReviewActions({ requestId }: { requestId: string }) {
  const approve = aprobarSolicitud.bind(null, requestId)
  const reject = rechazarSolicitud.bind(null, requestId)

  const [approveState, approveAction, approvePending] = useActionState(approve, { error: '' })
  const [rejectState, rejectAction, rejectPending] = useActionState(reject, { error: '' })

  const busy = approvePending || rejectPending

  return (
    <div className="space-y-4">
      <form action={approveAction}>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {approvePending ? 'Aprobando…' : 'Aprobar solicitud'}
        </button>
        {approveState.error && (
          <p className="mt-2 text-sm text-red-600" role="alert">{approveState.error}</p>
        )}
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">o rechazar</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form action={rejectAction} className="space-y-3">
        <div>
          <label htmlFor="rejection_reason" className="block text-sm font-medium text-slate-700 mb-1">
            Motivo del rechazo
          </label>
          <textarea
            id="rejection_reason"
            name="rejection_reason"
            rows={3}
            placeholder="Explica el motivo…"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>
        {rejectState.error && (
          <p className="text-sm text-red-600" role="alert">{rejectState.error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 active:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {rejectPending ? 'Rechazando…' : 'Rechazar solicitud'}
        </button>
      </form>
    </div>
  )
}
