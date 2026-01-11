import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Button } from '../components/Button.jsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightToBracket, faStethoscope } from '@fortawesome/free-solid-svg-icons'
import { BrButton, BrInput } from '@govbr-ds/webcomponents-react'

// Schemas de validação para login
const secretarySchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const cpfSchema = z.object({
  cpf: z.string().min(11, "Informe seu CPF"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

// Mapeamento de papéis para rotas iniciais
const rolePaths = {
  secretario: "/secretario",
  paciente: "/paciente",
  profissional: "/profissional",
};

function sanitizeCpf(value = "") {
  return value.replace(/\D/g, "");
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message || error.message || "Falha ao autenticar."
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('cpf')
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const prefillCpf = location.state?.cpf ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(secretarySchema) });

  const {
    register: registerCpf,
    handleSubmit: handleSubmitCpf,
    formState: { errors: cpfErrors, isSubmitting: isSubmittingCpf },
    reset: resetCpfForm,
    getValues: getCpfValues,
  } = useForm({
    resolver: zodResolver(cpfSchema),
    defaultValues: { cpf: prefillCpf, password: "" },
  });

  useEffect(() => {
    if (prefillCpf) {
      setMode("cpf");
      resetCpfForm({ cpf: prefillCpf, password: "" });
    }
  }, [prefillCpf, resetCpfForm]);

  const handleSecretaryLogin = handleSubmit(async (data) => {
    try {
      const user = await auth.login(data);
      const from = location.state?.from?.pathname;
      navigate(from || rolePaths[user.role] || "/", { replace: true });
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  });

  const handleCpfLogin = handleSubmitCpf(async (data) => {
    try {
      const payload = { cpf: sanitizeCpf(data.cpf), password: data.password };
      const user = await auth.loginWithCpf(payload);
      const from = location.state?.from?.pathname;
      navigate(from || rolePaths[user.role] || "/", { replace: true });
    } catch (error) {
      if (error?.response?.status === 409) {
        navigate("/definir-senha", { state: { cpf: sanitizeCpf(data.cpf) } });
        return;
      }
      window.alert(getErrorMessage(error));
    }
  });

  const goToPasswordSetup = () => {
    const currentCpf = sanitizeCpf(getCpfValues("cpf"));
    navigate("/definir-senha", { state: { cpf: currentCpf } });
  };

  return (
      <div className="space-y-6 p-6">
        <div className="text-center my-10 text-5xl">
          <FontAwesomeIcon icon={faStethoscope}>
          </FontAwesomeIcon>
            <span className='font-medium'>Qualifica Saúde</span>
        </div>

        {/* <PageHeader title="Entrar" /> */}
        <h1 class="text-4xl leading-16 font-semibold text-[#0c326f] pb-2.5 m-4 text-center">
          Entrar
      </h1>
        <div
          role="tablist"
          className="tabs tabs-boxed flex justify-around gap-4 mx-[20%]"
        >
          <button
            type="button"
            className={`tab bg-slate-300 rounded-md hover:bg-slate-400 transition-all flex-1 ${
              mode === "secretario" ? "tab-active !bg-[#0C326F] text-white" : ""
            }`}
            onClick={() => setMode("secretario")}
          >
            Secretário
          </button>
          <button
            type="button"
            className={`tab bg-slate-300 rounded-md hover:bg-slate-400 transition-all flex-1 ${
              mode === "cpf" ? "tab-active !bg-[#0C326F] text-white" : ""
            }`}
            onClick={() => setMode("cpf")}
          >
            Paciente / Profissional
          </button>
        </div>

        {mode === "secretario" && (
          <form onSubmit={handleSecretaryLogin} className="space-y-4 flex flex-col items-center gap-8">
            <div className='flex flex-col gap-3'>
            <FormField label="" error={errors.email?.message}>
              {/* <input
                type="email"
                className={`input input-bordered w-full ${
                  errors.email ? "input-error" : ""
                }`}
                placeholder="contato@email.com"
                {...register("email")}
                /> */}
                <BrInput
                  id="email"
                  name="email"
                  type="email"
                  label="E-mail"
                  error={!!errors.email} // se existe erro
                  message={errors.email?.message}
                  placeholder="contato@email.com"
                  required
                  className='scale-110'
                  {...register("email")}
                />
            </FormField>
            <FormField label="" error={errors.password?.message}>
              {/* <input
                type="password"
                className={`input input-bordered w-full ${
                  errors.password ? "input-error" : ""
                }`}
                placeholder="••••••••"
                {...register("password")}
              /> */}
              <BrInput
                id="password"
                name="password"
                type="password"
                label="Senha"
                placeholder="Insira sua senha"
                message={errors.password?.message}
                error={!!errors.password}
                required
                className='scale-110'
                {...register("password")}
              />
            </FormField>
                </div>
            {/* <Button
              type="submit"
              variant=""
              fullWidth
              disabled={isSubmitting}
              className="rounded-xl bg-blue-950 text-white"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button> */}
            <BrButton emphasis="primary" type="submit" disabled={isSubmitting} className='transform scale-120'>
                                      <FontAwesomeIcon icon={faRightToBracket} className="mr-2" />
                                      {isSubmitting ? "Entrando..." : "Entrar"}
                                      </BrButton>
          </form>
        )}

        {mode === "cpf" && (
          <form onSubmit={handleCpfLogin} className="space-y-4 flex flex-col items-center gap-8">
            <div className='flex flex-col gap-3'>

            <FormField label="" error={cpfErrors.cpf?.message}>
                <BrInput
                  id="cpf"
                  name="cpf"
                  label="CPF"
                  error={!!cpfErrors.cpf}
                  message={cpfErrors.cpf?.message}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  className='scale-110'
                  {...registerCpf("cpf")}
                />
            </FormField>
            <FormField label="" error={cpfErrors.password?.message}>
                <BrInput
                id="password"
                name="password"
                type="password"
                label="Senha"
                placeholder="Insira sua senha"
                message={cpfErrors.password?.message}
                error={!!cpfErrors.password}
                required
                className='scale-110'
                {...registerCpf("password")}
              />
            </FormField>
                </div>
            <BrButton emphasis="primary" type="submit" disabled={isSubmittingCpf} className='scale-120'>
                                      <FontAwesomeIcon icon={faRightToBracket} className="mr-2" />
                                      {isSubmittingCpf ? "Entrando..." : "Entrar"}
                                      </BrButton>
            <Button
              type="button"
              variant="link"
              fullWidth
              onClick={goToPasswordSetup}
              className='font-bold'
            >
              Criar ou redefinir senha
            </Button>
          </form>
        )}
      </div>
  );
}
