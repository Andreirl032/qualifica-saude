# Qualifica Saúde

## Frontend

- **Stack**: Vite (CRA obsoleto) com DaisyUI/Tailwind 4 facilitam desenvolvimento e estilização. Mock Service Worker simula a API enquanto o backend não existe.
- **Formulários**: `react-hook-form` + `zod` validam CPF, e-mail, OTP e senhas com schemas reutilizáveis.
- **Painéis mockados**: páginas de paciente, profissional e secretário consomem `documentService`/`secretaryService` mockados para procedimentos, qualificação e import/export de CSV.

### Como executar na sua máquina

```bash
cd frontend
npm install
npm run dev
```

### Estrutura de pastas

```
frontend/
├─ src/
│  ├─ components/     
│  ├─ pages/          
│  ├─ services/       # authService, documentService, secretaryService
│  ├─ mocks/          # Onde fica a lógica por trás do MSW
│  └─ context/         # AuthContext
|  └─ hooks/          # useAuth
└─ public/            # assets estáticos
```

### Fluxos principais

- **Login**: suporta credenciais por e-mail (secretário) e CPF (pacientes/profissionais) com fallback para criação de senha quando necessário.
- **Definir primeira senha**: fluxo em etapas (CPF → e-mail mascarado → OTP → senha) para confirmar identidade antes do primeiro acesso.
- **Painéis mockados**: paciente gerencia documentos/procedimentos; profissional acessa a tela de qualificação; secretário simula import/export de CSV e acompanha histórico.

### Próximo passo

Conectar os serviços ao backend real assim que os endpoints estiverem disponíveis.
