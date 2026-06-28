import Image from 'next/image'
import { sendOtpEmail } from './actions'
import LoginForm from './login-form'

export const metadata = {
  title: 'Iniciar sesión — Vacaciones Avándaro',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-md">
            <Image
              src="/logo.jpg"
              alt="Hotel Avándaro"
              width={96}
              height={96}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Hotel Avándaro
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sistema de Gestión de Vacaciones
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa tu correo electrónico y te enviaremos un enlace de acceso.
            </p>
          </div>

          <LoginForm action={sendOtpEmail} />
        </div>
      </div>
    </div>
  )
}
