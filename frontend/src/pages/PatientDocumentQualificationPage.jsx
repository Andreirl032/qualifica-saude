import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { qualifyDocument } from '../services/documentService.js'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Button } from '../components/Button.jsx'

const schema = z.object({
  status: z.enum(['aprovado', 'rejeitado']),
  observacoes: z.string().optional(),
})

export default function PatientDocumentQualificationPage() {
  const { documentoId } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { status: 'aprovado' } })

  const onSubmit = async (data) => {
    try {
      const id = documentoId || 'current'
      await qualifyDocument(id, data)
      alert('Qualificação registrada com sucesso')
      navigate('/profissional')
    } catch (e) {
      alert(e.message || 'Falha ao qualificar documento')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 flex flex-col items-center">
      <PageHeader
        align="left"
        title={`Qualificação de Documento ${documentoId ? `#${documentoId}` : ''}`}
        subtitle="Atualize o status do documento e registre observações clínicas."
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col items-center">
        <FormField label="Status" error={errors.status?.message}>
          <select className="select select-bordered" {...register('status')}>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
        </FormField>
        <FormField label="Observações" error={errors.observacoes?.message}>
          <textarea
            className="textarea textarea-bordered"
            rows={5}
            placeholder="Escreva notas clínicas e justificativas"
            {...register('observacoes')}
          />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
