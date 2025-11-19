import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as authService from '../services/authService.js'
import { FormField } from '../components/FormField.jsx'
import { Alert } from '../components/Alert.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { Button } from '../components/Button.jsx'

const cpfSchema = z.object({
  cpf: z.string().min(11, 'Informe um CPF válido').regex(/^[0-9.-]+$/, 'Apenas números e pontuação'),
})

const emailSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
})

const defineSchema = z.object({
  otp: z.string().length(6, 'Código com 6 dígitos'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme a senha'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'As senhas não conferem',
})

function sanitizeCpf(value = '') {
  return value.replace(/\D/g, '')
}

export default function CreatePasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialCpf = useMemo(() => location.state?.cpf ?? '', [location.state])

  const [step, setStep] = useState('request')
  const [activeCpf, setActiveCpf] = useState(initialCpf)
  const [otpPreview, setOtpPreview] = useState('')
  const [contactHint, setContactHint] = useState('')
  const [cpfConfirmed, setCpfConfirmed] = useState(Boolean(initialCpf))

  const { register: registerCpf, handleSubmit: handleCpfSubmit, formState: { errors: cpfErrors, isSubmitting: confirmingCpf }, reset: resetCpf } = useForm({
    resolver: zodResolver(cpfSchema),
    defaultValues: { cpf: initialCpf },
  })

  const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors, isSubmitting: requesting }, reset: resetEmail, watch: watchEmail } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const { register: registerDefine, handleSubmit: handleDefineSubmit, formState: { errors: defineErrors, isSubmitting: defining }, reset: resetDefine } = useForm({
    resolver: zodResolver(defineSchema),
  })

  const watchedEmail = watchEmail('email')

  const confirmCpf = handleCpfSubmit(async (values) => {
    try {
      const cpf = sanitizeCpf(values.cpf)
      const response = await authService.getContactHint({ cpf })
      setActiveCpf(cpf)
      setContactHint(response.contactHint)
      setCpfConfirmed(true)
      resetEmail({ email: '' })
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Falha ao buscar contato.'
      window.alert(message)
    }
  })

  const requestOtp = handleEmailSubmit(async (values) => {
    try {
      const response = await authService.requestOtp({ cpf: activeCpf, email: values.email })
      setOtpPreview(response.otpPreview)
      setContactHint(response.contactHint)
      setStep('define')
      resetDefine()
      window.alert(`Código enviado: ${response.otpPreview}`)
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Falha ao solicitar código.'
      window.alert(message)
    }
  })

  const definePassword = handleDefineSubmit(async (values) => {
    try {
      await authService.setPassword({ cpf: activeCpf, otp: values.otp, password: values.password })
      setStep('success')
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Não foi possível definir a senha.'
      window.alert(message)
    }
  })

  const startOver = () => {
    setStep('request')
    resetCpf({ cpf: '' })
    resetEmail({ email: '' })
    resetDefine()
    setOtpPreview('')
    setContactHint('')
    setActiveCpf('')
    setCpfConfirmed(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Definir primeira senha"
        subtitle="Usamos um código de uso único para garantir que apenas o titular do CPF conclua o cadastro."
      />

      {step === 'request' && (
        <div className="space-y-4">
          <form className="space-y-4" onSubmit={confirmCpf}>
            <FormField label="CPF" error={cpfErrors.cpf?.message}>
              <input
                className={`input input-bordered ${cpfErrors.cpf ? 'input-error' : ''}`}
                placeholder="000.000.000-00"
                maxLength={14}
                {...registerCpf('cpf')}
              />
            </FormField>
            <Button variant="secondary" type="submit" fullWidth isLoading={confirmingCpf}>
              {confirmingCpf ? 'Buscando contato...' : 'Continuar'}
            </Button>
          </form>

          {cpfConfirmed && contactHint && (
            <form className="space-y-4" onSubmit={requestOtp}>
              <FormField
                label={(
                  <>
                    Informe o e-mail cadastrado{' '}
                    <span className="font-mono">{contactHint}</span>{' '}
                    para enviarmos o código de confirmação:
                  </>
                )}
                error={emailErrors.email?.message}
              >
                <input
                  type="email"
                  className={`input input-bordered ${emailErrors.email ? 'input-error' : ''}`}
                  placeholder="seuemail@exemplo.com"
                  {...registerEmail('email')}
                />
              </FormField>
              <Button
                variant="primary"
                type="submit"
                fullWidth
                isLoading={requesting}
                disabled={!watchedEmail}
              >
                {requesting ? 'Enviando código...' : 'Receber código por e-mail'}
              </Button>
            </form>
          )}

          <p className="text-center text-sm">
            Já tem senha? <Link to="/login" className="link">Voltar para login</Link>
          </p>
        </div>
      )}

      {step === 'define' && (
        <form className="space-y-4" onSubmit={definePassword}>
          <Alert>
            <div className="flex-1">
              <h3 className="font-bold">Código enviado</h3>
              <div className="text-sm opacity-70">
                Enviamos o código {otpPreview} para o contato {contactHint || 'cadastrado'}.
              </div>
            </div>
            <button type="button" className="btn btn-link" onClick={startOver}>Trocar CPF</button>
          </Alert>

          <p className="text-sm text-base-content/70">Informe o código recebido e escolha uma senha segura.</p>

          <FormField label="Código" error={defineErrors.otp?.message}>
            <input
              className={`input input-bordered ${defineErrors.otp ? 'input-error' : ''}`}
              placeholder="123456"
              maxLength={6}
              {...registerDefine('otp')}
            />
          </FormField>

          <FormField label="Nova senha" error={defineErrors.password?.message}>
            <input
              type="password"
              className={`input input-bordered ${defineErrors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              {...registerDefine('password')}
            />
          </FormField>

          <FormField label="Confirmar senha" error={defineErrors.confirmPassword?.message}>
            <input
              type="password"
              className={`input input-bordered ${defineErrors.confirmPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
              {...registerDefine('confirmPassword')}
            />
          </FormField>

          <Button variant="primary" type="submit" fullWidth isLoading={defining}>
            {defining ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      )}

      {step === 'success' && (
        <div className="space-y-4 text-center">
          <Alert variant="success" className="justify-center">
            <span>Senha criada com sucesso! Você já pode acessar com CPF e senha.</span>
          </Alert>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/login', { replace: true, state: { cpf: activeCpf } })}
          >
            Ir para login
          </Button>
        </div>
      )}
    </div>
  )
}
