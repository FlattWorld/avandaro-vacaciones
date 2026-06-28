'use client'

import { useActionState } from 'react'

interface LoginFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>
}

const initialState = { error: '' }

export default function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string }, formData: FormData) => {
      const result = await action(formData)
      return result ?? { error: '' }
    },
    initialState
  )

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu.nombre@grupoavandaro.com.mx"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
        {pending ? 'Enviando…' : 'Enviar código de acceso'}
      </button>
    </form>
  )
}
