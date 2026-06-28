import ImportForm from './form'

export const metadata = { title: 'Importar Empleados — Panel RH' }

export default function ImportarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Importar empleados</h1>
        <p className="mt-1 text-slate-500 text-sm">
          Pega los datos del Excel. Los periodos de vacaciones se generan automáticamente.
        </p>
      </div>
      <ImportForm />
    </div>
  )
}
