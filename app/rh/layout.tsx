import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Nav from '@/components/nav'

export default async function RhLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('full_name, role')
    .eq('email', user.email!)
    .single()

  if (!employee) redirect('/login')
  if (employee.role !== 'rh') redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      <Nav role="rh" fullName={employee.full_name} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
