import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Button } from '../components/Button.jsx'

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
      <PageHeader title="Entrar" />

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
          <FormField label="E-mail" error={errors.email?.message}>
            <input
              type="email"
              className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
              placeholder="contato@email.com"
              {...register('email')}
            />
          </FormField>
          <FormField label="Senha" error={errors.password?.message}>
            <input
              type="password"
              className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              {...register('password')}
            />
          </FormField>
          <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      )}

      {mode === 'cpf' && (
        <form onSubmit={handleCpfLogin} className="space-y-4">
          <FormField label="CPF" error={cpfErrors.cpf?.message}>
            <input
              className={`input input-bordered ${cpfErrors.cpf ? 'input-error' : ''}`}
              placeholder="000.000.000-00"
              maxLength={14}
              {...registerCpf('cpf')}
            />
          </FormField>
          <FormField label="Senha" error={cpfErrors.password?.message}>
            <input
              type="password"
              className={`input input-bordered ${cpfErrors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              {...registerCpf('password')}
            />
          </FormField>
          <Button type="submit" variant="primary" fullWidth isLoading={isSubmittingCpf}>
            {isSubmittingCpf ? 'Validando...' : 'Entrar com CPF'}
          </Button>
          <Button type="button" variant="link" fullWidth onClick={goToPasswordSetup}>
            Criar ou redefinir senha
          </Button>
        </form>
      )}
    </div>
  )
}
