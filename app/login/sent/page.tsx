export const metadata = { title: 'Revisa tu correo — Vacaciones Avándaro' }

export default async function SentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

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

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 space-y-4 text-center">
          <div className="text-4xl">✉️</div>
          <h2 className="text-lg font-semibold text-stone-800">
            Revisa tu correo
          </h2>
          <p className="text-sm text-stone-500">
            Enviamos un enlace de acceso a{' '}
            <span className="font-medium text-stone-700">{email}</span>.
            Haz click en él para entrar.
          </p>
          <p className="text-xs text-stone-400">
            El enlace expira en 1 hora. Si no lo ves, revisa la carpeta de spam.
          </p>
          <a
            href="/login"
            className="block text-sm text-amber-600 hover:underline mt-2"
          >
            Usar otro correo
          </a>
        </div>
      </div>
    </div>
  )
}
