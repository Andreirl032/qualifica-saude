import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const schema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['paciente', 'profissional', 'secretario']),
})

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'paciente' } })
  const auth = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    try {
      await auth.register(data)
      alert('Conta criada! Faça login para continuar.')
      navigate('/login', { replace: true })
    } catch (e) {
      alert(e.message || 'Falha no cadastro')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-2xl font-semibold text-center">Criar Conta</h2>
      <label className="form-control">
        <div className="label"><span className="label-text">Nome</span></div>
        <input className={`input input-bordered ${errors.name ? 'input-error' : ''}`} placeholder="Seu nome" {...register('name')} />
        {errors.name && <span className="text-error text-sm">{errors.name.message}</span>}
      </label>
      <label className="form-control">
        <div className="label"><span className="label-text">E-mail</span></div>
        <input type="email" className={`input input-bordered ${errors.email ? 'input-error' : ''}`} placeholder="seu@email.com" {...register('email')} />
        {errors.email && <span className="text-error text-sm">{errors.email.message}</span>}
      </label>
      <label className="form-control">
        <div className="label"><span className="label-text">Senha</span></div>
        <input type="password" className={`input input-bordered ${errors.password ? 'input-error' : ''}`} placeholder="••••••••" {...register('password')} />
        {errors.password && <span className="text-error text-sm">{errors.password.message}</span>}
      </label>
      <label className="form-control">
        <div className="label"><span className="label-text">Papel</span></div>
        <select className="select select-bordered" {...register('role')}>
          <option value="paciente">Paciente</option>
          <option value="profissional">Profissional</option>
          <option value="secretario">Secretário</option>
        </select>
        {errors.role && <span className="text-error text-sm">{errors.role.message}</span>}
      </label>
      <button className={`btn btn-primary w-full ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
        {isSubmitting ? 'Criando...' : 'Criar conta'}
      </button>
      <p className="text-center text-sm">Já tem conta? <Link to="/login" className="link">Entrar</Link></p>
    </form>
  )
}
