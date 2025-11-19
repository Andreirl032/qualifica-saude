import { PageHeader } from '../components/PageHeader.jsx'
import { ButtonLink } from '../components/ButtonLink.jsx'

export default function ProfessionalHomePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Início do Profissional de Saúde" align="left" />
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Qualificação de Documento</h2>
          <p>Qualifique documentos de pacientes conforme os protocolos.</p>
          <div className="card-actions">
            <ButtonLink to="/paciente/qualificacao-documento" variant="primary">
              Abrir qualificação
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  )
}
