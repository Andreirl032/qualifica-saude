import { Link } from 'react-router-dom'

export default function ProfessionalHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Início do Profissional de Saúde</h1>
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Qualificação de Documento</h2>
          <p>Qualifique documentos de pacientes conforme os protocolos.</p>
          <div className="card-actions">
            <Link to="/paciente/qualificacao-documento" className="btn btn-primary">Abrir qualificação</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
