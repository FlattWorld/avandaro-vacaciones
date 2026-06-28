import { sendOtpEmail } from './actions'
import LoginForm from './login-form'

export const metadata = {
  title: 'Iniciar sesión — Vacaciones Avándaro',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Hotel Avándaro
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Sistema de Gestión de Vacaciones
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Ingresa tu correo corporativo y te enviaremos un código de acceso.
            </p>
          </div>

          <LoginForm action={sendOtpEmail} />
        </div>
      </div>
    </div>
  )
}
