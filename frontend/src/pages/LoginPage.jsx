import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (data) => {
    try {
      const user = await auth.login(data)
      const map = { secretario: '/secretario', paciente: '/paciente', profissional: '/profissional' }
      const from = location.state?.from?.pathname
      navigate(from || map[user.role] || '/', { replace: true })
    } catch (e) {
      alert(e.message || 'Falha no login')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-2xl font-semibold text-center">Entrar</h2>
      <label className="form-control">
        <div className="label"><span className="label-text text-left">E-mail</span></div>
        <input type="email" className={"input input-bordered ${errors.email ? 'input-error' : ''}"} placeholder="seu@email.com" {...register('email')} />
        {errors.email && <span className="text-error text-sm">{errors.email.message}</span>}
      </label>
      <label className="form-control">
        <div className="label"><span className="label-text text-left">Senha</span></div>
        <input type="password" className={"input input-bordered ${errors.password ? 'input-error' : ''}"} placeholder="••••••••" {...register('password')} />
        {errors.password && <span className="text-error text-sm">{errors.password.message}</span>}
      </label>
      <button className={"btn btn-primary w-full ${isSubmitting ? 'loading' : ''} mt-4"} disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
      <p className="text-center text-sm">Não tem conta? <Link to="/criar-conta" className="link">Criar conta</Link></p>
    </form>
  )
}
