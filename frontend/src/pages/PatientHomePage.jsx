import { useEffect, useMemo, useState } from 'react'
import { getPatientProcedures, uploadPatientDocument } from '../services/documentService.js'
import { PageHeader } from '../components/PageHeader.jsx'
import { Alert } from '../components/Alert.jsx'
import { Badge } from '../components/Badge.jsx'

const statusLabels = {
  'pendente-documentos': 'Documentos pendentes',
  'aguardando-analise': 'Aguardando análise',
  agendado: 'Agendado',
  completo: 'Concluído',
}

const docStatusLabels = {
  pendente: 'Pendente de envio',
  enviado: 'Enviado, aguardando análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}

function statusBadgeVariant(status) {
  switch (status) {
    case 'pendente-documentos':
    case 'pendente':
      return 'warning'
    case 'aguardando-analise':
    case 'enviado':
      return 'info'
    case 'aprovado':
    case 'completo':
      return 'success'
    case 'rejeitado':
      return 'error'
    default:
      return 'default'
  }
}

export default function PatientHomePage() {
  const [procedures, setProcedures] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadingId, setUploadingId] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setIsLoading(true)
        const list = await getPatientProcedures()
        if (!active) return
        setProcedures(Array.isArray(list) ? list : [])
        setError(null)
      } catch (e) {
        if (!active) return
        setError(e?.response?.data?.message || e.message || 'Não foi possível carregar seus procedimentos.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const pendingDocuments = useMemo(() => {
    const items = []
    for (const proc of procedures) {
      for (const doc of proc.requiredDocuments || []) {
        if (doc.status === 'pendente' || doc.status === 'rejeitado') {
          items.push({ procedure: proc, document: doc })
        }
      }
    }
    return items
  }, [procedures])

  async function handleUploadClick(procedureId, documentId) {
    const mockFileName = window.prompt('Nome do arquivo para enviar (mock)?', 'risco-cirurgico.pdf')
    if (!mockFileName) return
    try {
      setUploadingId(`${procedureId}:${documentId}`)
      const updated = await uploadPatientDocument(procedureId, documentId, mockFileName)
      setProcedures((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      window.alert('Documento enviado com sucesso! Será analisado pela equipe em breve.')
    } catch (e) {
      window.alert(e?.response?.data?.message || e.message || 'Falha ao enviar documento.')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Área do Paciente"
        subtitle="Veja abaixo seus procedimentos e quais documentos ainda precisam ser enviados para a equipe de saúde."
        align="left"
      />

      {error && (
        <Alert variant="error">
          <span>{error}</span>
        </Alert>
      )}

      <section className="card bg-base-100 shadow-md">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="card-title">Documentos pendentes</h2>
              <p className="text-sm text-base-content/70">Envie o que estiver faltando para não atrasar seu procedimento.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center opacity-70">Carregando seus documentos...</div>
          ) : pendingDocuments.length === 0 ? (
            <Alert variant="success">
              <span>Você não tem documentos pendentes no momento.</span>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th>Documento</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDocuments.map(({ procedure, document }) => {
                    const key = `${procedure.id}:${document.id}`
                    return (
                      <tr key={key}>
                        <td>
                          <div className="font-medium">{procedure.name}</div>
                          <div className="text-xs text-base-content/70">{procedure.date} · {procedure.facility}</div>
                        </td>
                        <td>{document.name}</td>
                        <td>
                          <Badge variant={statusBadgeVariant(document.status)}>
                            {docStatusLabels[document.status] || document.status}
                          </Badge>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`btn btn-sm btn-primary ${uploadingId === key ? 'loading' : ''}`}
                            disabled={uploadingId === key}
                            onClick={() => handleUploadClick(procedure.id, document.id)}
                          >
                            {uploadingId === key ? 'Enviando...' : 'Enviar documento mockado'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card bg-base-100 shadow-md">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="card-title">Meus procedimentos</h2>
              <p className="text-sm text-base-content/70">Resumo dos procedimentos agendados e já concluídos.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center opacity-70">Carregando seus procedimentos...</div>
          ) : procedures.length === 0 ? (
            <Alert>
              <span>Você ainda não possui procedimentos cadastrados.</span>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {procedures.map((proc) => (
                <article key={proc.id} className="card bg-base-100 border border-base-200">
                  <div className="card-body space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{proc.name}</h3>
                        <p className="text-xs text-base-content/70">{proc.facility}</p>
                      </div>
                      <Badge variant={statusBadgeVariant(proc.status)}>
                        {statusLabels[proc.status] || proc.status}
                      </Badge>
                    </div>
                    <p className="text-sm">{proc.date}</p>
                    <div className="divider my-2" />
                    <p className="text-xs font-semibold mb-1">Documentos deste procedimento</p>
                    <ul className="space-y-1 text-sm">
                      {(proc.requiredDocuments || []).map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between gap-2">
                          <div>
                            <span>{doc.name}</span>
                            {doc.lastUpload && (
                              <div className="text-[11px] text-base-content/60">
                                Último envio: {new Date(doc.lastUpload.uploadedAt).toLocaleString()} ({doc.lastUpload.fileName})
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={statusBadgeVariant(doc.status)} size="sm">
                              {docStatusLabels[doc.status] || doc.status}
                            </Badge>
                            {(doc.status === 'pendente' || doc.status === 'rejeitado') && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => handleUploadClick(proc.id, doc.id)}
                              >
                                Enviar
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
