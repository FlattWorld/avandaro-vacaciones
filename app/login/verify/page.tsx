import { verifyOtp } from '../actions'
import VerifyForm from './verify-form'

export const metadata = {
  title: 'Verificar código — Vacaciones Avándaro',
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  if (!email) {
    return null // el middleware redirige si no hay sesión; aquí solo protegemos el param
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hotel Avándaro
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sistema de Gestión de Vacaciones
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Ingresa tu código
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enviamos un código de 6 dígitos a{' '}
              <span className="font-medium text-slate-700">{email}</span>.
              Revisa también tu carpeta de spam.
            </p>
          </div>

          <VerifyForm action={verifyOtp} email={email} />
        </div>
      </div>
    </div>
  )
}
