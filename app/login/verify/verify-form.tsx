'use client'

import { useActionState } from 'react'

interface VerifyFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  email: string
}

const initialState = { error: '' }

export default function VerifyForm({ action, email }: VerifyFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string }, formData: FormData) => {
      const result = await action(formData)
      return result ?? { error: '' }
    },
    initialState
  )

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="email" value={email} />

      <div>
        <label
          htmlFor="token"
          className="block text-sm font-medium text-slate-700"
        >
          Código de verificación
        </label>
        <input
          id="token"
          name="token"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          placeholder="123456"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-xl font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Verificando…' : 'Verificar código'}
      </button>

      <p className="text-center text-xs text-slate-500">
        <a href="/login" className="text-amber-600 hover:underline">
          Usar otro correo
        </a>
      </p>
    </form>
  )
}
