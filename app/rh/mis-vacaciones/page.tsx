import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MisVacacionesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!employee) redirect('/rh')

  redirect(`/rh/empleados/${employee.id}`)
}
