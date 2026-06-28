import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Redirige al panel correcto según el rol del usuario autenticado
export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('email', user.email!)
    .single()

  if (!employee) {
    // Usuario autenticado en Supabase pero sin registro en employees
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-slate-600">
            Tu cuenta no está registrada en el sistema. Contacta a RH.
          </p>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-amber-600 hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (employee.role === 'rh') redirect('/rh')
  redirect('/dashboard')
}
