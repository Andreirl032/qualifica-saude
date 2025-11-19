import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as authService from '../services/authService.js'

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
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Definir primeira senha</h2>
        <p className="text-base-content/70">Usamos um código de uso único para garantir que apenas o titular do CPF conclua o cadastro.</p>
      </div>

      {step === 'request' && (
        <div className="space-y-4">
          <form className="space-y-4" onSubmit={confirmCpf}>
            <label className="form-control">
              <div className="label"><span className="label-text">CPF</span></div>
              <input className={`input input-bordered ${cpfErrors.cpf ? 'input-error' : ''}`} placeholder="000.000.000-00" maxLength={14} {...registerCpf('cpf')} />
              {cpfErrors.cpf && <span className="text-error text-sm">{cpfErrors.cpf.message}</span>}
            </label>
            <button className={`btn btn-secondary w-full ${confirmingCpf ? 'loading' : ''}`} disabled={confirmingCpf}>
              {confirmingCpf ? 'Buscando contato...' : 'Continuar'}
            </button>
          </form>

          {cpfConfirmed && contactHint && (
            <form className="space-y-4" onSubmit={requestOtp}>
              <label className="form-control">
                <div className="label">
                  <span className="label-text">
                    Informe o e-mail cadastrado {contactHint} para enviarmos o código de confirmação:
                  </span>
                </div>
                <input
                  type="email"
                  className={`input input-bordered ${emailErrors.email ? 'input-error' : ''}`}
                  placeholder="seuemail@exemplo.com"
                  {...registerEmail('email')}
                />
                {emailErrors.email && (
                  <span className="text-error text-sm">{emailErrors.email.message}</span>
                )}
              </label>
              <button
                className={`btn btn-primary w-full ${requesting ? 'loading' : ''}`}
                type="submit"
                disabled={requesting || !watchedEmail}
              >
                {requesting ? 'Enviando código...' : 'Receber código por e-mail'}
              </button>
            </form>
          )}

          <p className="text-center text-sm">
            Já tem senha? <Link to="/login" className="link">Voltar para login</Link>
          </p>
        </div>
      )}

      {step === 'define' && (
        <form className="space-y-4" onSubmit={definePassword}>
          <div className="alert">
            <div>
              <h3 className="font-bold">Código enviado</h3>
              <div className="text-sm opacity-70">
                Enviamos o código {otpPreview} para o contato {contactHint || 'cadastrado'}.
              </div>
            </div>
            <button type="button" className="btn btn-link" onClick={startOver}>Trocar CPF</button>
          </div>

          <p className="text-sm text-base-content/70">Informe o código recebido e escolha uma senha segura.</p>

          <label className="form-control">
            <div className="label"><span className="label-text">Código</span></div>
            <input className={`input input-bordered ${defineErrors.otp ? 'input-error' : ''}`} placeholder="123456" maxLength={6} {...registerDefine('otp')} />
            {defineErrors.otp && <span className="text-error text-sm">{defineErrors.otp.message}</span>}
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Nova senha</span></div>
            <input type="password" className={`input input-bordered ${defineErrors.password ? 'input-error' : ''}`} placeholder="••••••••" {...registerDefine('password')} />
            {defineErrors.password && <span className="text-error text-sm">{defineErrors.password.message}</span>}
          </label>

          <label className="form-control">
            <div className="label"><span className="label-text">Confirmar senha</span></div>
            <input type="password" className={`input input-bordered ${defineErrors.confirmPassword ? 'input-error' : ''}`} placeholder="••••••••" {...registerDefine('confirmPassword')} />
            {defineErrors.confirmPassword && <span className="text-error text-sm">{defineErrors.confirmPassword.message}</span>}
          </label>

          <button className={`btn btn-primary w-full ${defining ? 'loading' : ''}`} disabled={defining}>
            {defining ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="space-y-4 text-center">
          <div className="alert alert-success justify-center">
            <span>Senha criada com sucesso! Você já pode acessar com CPF e senha.</span>
          </div>
          <button className="btn btn-primary w-full" onClick={() => navigate('/login', { replace: true, state: { cpf: activeCpf } })}>
            Ir para login
          </button>
        </div>
      )}
    </div>
  )
}
