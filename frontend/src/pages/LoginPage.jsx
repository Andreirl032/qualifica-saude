import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const secretarySchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const cpfSchema = z.object({
  cpf: z.string().min(11, 'Informe seu CPF'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const rolePaths = { secretario: '/secretario', paciente: '/paciente', profissional: '/profissional' }

function sanitizeCpf(value = '') {
  return value.replace(/\D/g, '')
}

function getErrorMessage(error) {
  return error?.response?.data?.message || error.message || 'Falha ao autenticar.'
}

export default function LoginPage() {
  const [mode, setMode] = useState('secretario')
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const prefillCpf = location.state?.cpf ?? ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(secretarySchema) })

  const {
    register: registerCpf,
    handleSubmit: handleSubmitCpf,
    formState: { errors: cpfErrors, isSubmitting: isSubmittingCpf },
    reset: resetCpfForm,
    getValues: getCpfValues,
  } = useForm({ resolver: zodResolver(cpfSchema), defaultValues: { cpf: prefillCpf, password: '' } })

  useEffect(() => {
    if (prefillCpf) {
      setMode('cpf')
      resetCpfForm({ cpf: prefillCpf, password: '' })
    }
  }, [prefillCpf, resetCpfForm])

  const handleSecretaryLogin = handleSubmit(async (data) => {
    try {
      const user = await auth.login(data)
      const from = location.state?.from?.pathname
      navigate(from || rolePaths[user.role] || '/', { replace: true })
    } catch (error) {
      window.alert(getErrorMessage(error))
    }
  })

  const handleCpfLogin = handleSubmitCpf(async (data) => {
    try {
      const payload = { cpf: sanitizeCpf(data.cpf), password: data.password }
      const user = await auth.loginWithCpf(payload)
      const from = location.state?.from?.pathname
      navigate(from || rolePaths[user.role] || '/', { replace: true })
    } catch (error) {
      if (error?.response?.status === 409) {
        navigate('/definir-senha', { state: { cpf: sanitizeCpf(data.cpf) } })
        return
      }
      window.alert(getErrorMessage(error))
    }
  })

  const goToPasswordSetup = () => {
    const currentCpf = sanitizeCpf(getCpfValues('cpf'))
    navigate('/definir-senha', { state: { cpf: currentCpf } })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center">Entrar</h2>

      <div role="tablist" className="tabs tabs-boxed">
        <button type="button" className={`tab ${mode === 'secretario' ? 'tab-active' : ''}`} onClick={() => setMode('secretario')}>
          Secretário
        </button>
        <button type="button" className={`tab ${mode === 'cpf' ? 'tab-active' : ''}`} onClick={() => setMode('cpf')}>
          Paciente / Profissional
        </button>
      </div>

      {mode === 'secretario' && (
        <form onSubmit={handleSecretaryLogin} className="space-y-4">
          <label className="form-control">
            <div className="label"><span className="label-text">E-mail</span></div>
            <input type="email" className={`input input-bordered ${errors.email ? 'input-error' : ''}`} placeholder="contato@email.com" {...register('email')} />
            {errors.email && <span className="text-error text-sm">{errors.email.message}</span>}
          </label>
          <label className="form-control">
            <div className="label"><span className="label-text">Senha</span></div>
            <input type="password" className={`input input-bordered ${errors.password ? 'input-error' : ''}`} placeholder="••••••••" {...register('password')} />
            {errors.password && <span className="text-error text-sm">{errors.password.message}</span>}
          </label>
          <button className={`btn btn-primary w-full ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      )}

      {mode === 'cpf' && (
        <form onSubmit={handleCpfLogin} className="space-y-4">
          <label className="form-control">
            <div className="label"><span className="label-text">CPF</span></div>
            <input className={`input input-bordered ${cpfErrors.cpf ? 'input-error' : ''}`} placeholder="000.000.000-00" maxLength={14} {...registerCpf('cpf')} />
            {cpfErrors.cpf && <span className="text-error text-sm">{cpfErrors.cpf.message}</span>}
          </label>
          <label className="form-control">
            <div className="label"><span className="label-text">Senha</span></div>
            <input type="password" className={`input input-bordered ${cpfErrors.password ? 'input-error' : ''}`} placeholder="••••••••" {...registerCpf('password')} />
            {cpfErrors.password && <span className="text-error text-sm">{cpfErrors.password.message}</span>}
          </label>
          <button className={`btn btn-primary w-full ${isSubmittingCpf ? 'loading' : ''}`} disabled={isSubmittingCpf}>
            {isSubmittingCpf ? 'Validando...' : 'Entrar com CPF'}
          </button>
          <button type="button" className="btn btn-link w-full" onClick={goToPasswordSetup}>
            Criar ou redefinir senha
          </button>
        </form>
      )}
    </div>
  )
}
