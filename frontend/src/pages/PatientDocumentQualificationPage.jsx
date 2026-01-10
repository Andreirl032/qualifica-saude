import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { qualifyDocument, getDocumentDetails, getDocumentFileUrl } from '../services/documentService.js'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Button } from '../components/Button.jsx'
import { Alert } from '../components/Alert.jsx'
import { Badge } from '../components/Badge.jsx'

const schema = z.object({
  status: z.enum(['aprovado', 'rejeitado']),
  observacoes: z.string().optional(),
})

export default function PatientDocumentQualificationPage() {
  const { documentoId } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ 
    resolver: zodResolver(schema), 
    defaultValues: { status: 'aprovado' } 
  })

  useEffect(() => {
    async function loadDocument() {
      try {
        setIsLoading(true)
        const data = await getDocumentDetails(documentoId)
        setDocument(data)
        
        if (data.last_upload_filename) {
          const url = getDocumentFileUrl(documentoId)
          setPdfUrl(url)
        }
        
        setError(null)
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Erro ao carregar documento')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (documentoId) {
      loadDocument()
    }
  }, [documentoId])

  const onSubmit = async (data) => {
    try {
      await qualifyDocument(documentoId, data)
      alert('Qualificação registrada com sucesso')
      navigate('/profissional')
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Falha ao qualificar documento')
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4 text-base-content/70">Carregando documento...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert variant="error">{error}</Alert>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        align="left"
        title={`Qualificação: ${document?.name || 'Documento'}`}
        subtitle={`Paciente: ${document?.patient?.name || 'Desconhecido'} | CPF: ${document?.patient?.cpf || '-'}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualizador de PDF */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-lg">Documento Enviado</h3>
            {pdfUrl ? (
              <div className="border border-base-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Visualizador de PDF"
                />
              </div>
            ) : (
              <Alert variant="warning">Nenhum arquivo foi enviado ainda.</Alert>
            )}
            {document?.last_upload_filename && (
              <div className="text-sm text-base-content/70 mt-2">
                Arquivo: {document.last_upload_filename}
                {document.last_upload_at && (
                  <> · Enviado em {new Date(document.last_upload_at).toLocaleString('pt-BR')}</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Formulário de Qualificação */}
        <div className="space-y-4">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body space-y-3">
              <h3 className="card-title text-lg">Informações do Procedimento</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Procedimento:</span> {document?.procedure?.name}
                </div>
                <div>
                  <span className="font-semibold">Data:</span> {document?.procedure?.date}
                </div>
                <div>
                  <span className="font-semibold">Unidade:</span> {document?.procedure?.facility}
                </div>
                <div>
                  <span className="font-semibold">Status atual:</span>{' '}
                  <Badge variant={document?.status === 'enviado' ? 'info' : 'default'}>
                    {document?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h3 className="card-title text-lg">Qualificar Documento</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField label="Status" error={errors.status?.message}>
                  <select className="select select-bordered w-full" {...register('status')}>
                    <option value="aprovado"> Aprovado</option>
                    <option value="rejeitado">✗ Rejeitado</option>
                  </select>
                </FormField>
                
                <FormField label="Observações Clínicas" error={errors.observacoes?.message}>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows={5}
                    placeholder="Escreva notas clínicas, justificativas ou orientações para o paciente..."
                    {...register('observacoes')}
                  />
                </FormField>
                
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Qualificação'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
