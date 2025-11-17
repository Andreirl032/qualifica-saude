import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { qualifyDocument } from '../services/documentService.js'

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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Qualificação de Documento {documentoId ? `#${documentoId}` : ''}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label className="form-control">
          <div className="label"><span className="label-text">Status</span></div>
          <select className="select select-bordered" {...register('status')}>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
          </select>
          {errors.status && <span className="text-error text-sm">{errors.status.message}</span>}
        </label>
        <label className="form-control">
          <div className="label"><span className="label-text">Observações</span></div>
          <textarea className="textarea textarea-bordered" rows={5} placeholder="Escreva notas clínicas e justificativas" {...register('observacoes')} />
          {errors.observacoes && <span className="text-error text-sm">{errors.observacoes.message}</span>}
        </label>
        <div className="flex gap-2">
          <button className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" className="btn" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
