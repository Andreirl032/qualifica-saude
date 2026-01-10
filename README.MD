# 🏥 Qualifica Saúde

Sistema de gestão de documentos médicos para procedimentos de saúde, desenvolvido para facilitar a comunicação entre pacientes, profissionais de saúde e secretaria.

## 📋 Sobre o Projeto

O Qualifica Saúde é uma plataforma web que permite:
- **Pacientes**: Visualizar procedimentos agendados e fazer upload de documentos necessários
- **Profissionais**: Analisar e qualificar documentos enviados pelos pacientes
- **Secretaria**: Gerenciar cadastros em massa via CSV e acompanhar histórico

## 🚀 Tecnologias

### Backend
- Python 3.11+
- Flask
- PostgreSQL
- SQLAlchemy
- JWT para autenticação
- Pydantic para validação

### Frontend
- React 18
- Vite
- React Router
- Axios
- TailwindCSS + DaisyUI

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- Python 3.11 ou superior
- Node.js 18 ou superior
- PostgreSQL 14 ou superior

### 1️⃣ Configurar Backend

```bash
# Navegar para o diretório backend
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Instalar dependências
pip install -r requirements.txt

# Criar banco de dados PostgreSQL
createdb qualifica_saude

# Configurar variáveis de ambiente (criar arquivo .env)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qualifica_saude
# JWT_SECRET_KEY=sua-chave-secreta
# CORS_ORIGINS=http://localhost:5173

# Inicializar banco de dados com dados de exemplo
python seeds.py

# Iniciar servidor
python app.py
```

O backend estará rodando em `http://localhost:5000`

### 2️⃣ Configurar Frontend

```bash
# Navegar para o diretório frontend
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 👥 Usuários de Teste

| Email/CPF | Senha | Perfil | Descrição |
|-----------|-------|--------|-----------|
| `paciente@demo.com`<br>`12312312312` | `123456` | 👤 Paciente | Visualiza procedimentos e envia documentos |
| `profissional@demo.com`<br>`22222222222` | `123456` | 👨‍⚕️ Profissional | Qualifica documentos enviados |
| `secretario@demo.com` | `123456` | 📋 Secretário | Gerencia cadastros e uploads CSV |
| `primeiro@demo.com`<br>`44444444444` | *(sem senha)* | 👤 Paciente | Exemplo de primeiro acesso |

## 📁 Estrutura do Projeto

```
qualifica-saude/
├── backend/
│   ├── api/              # Endpoints da API
│   ├── models/           # Modelos do banco de dados
│   ├── services/         # Lógica de negócio
│   ├── schemas/          # Validação de dados (Pydantic)
│   ├── utils/            # Utilitários (JWT, helpers)
│   ├── uploads/          # Arquivos enviados pelos pacientes
│   ├── app.py            # Aplicação Flask
│   ├── config.py         # Configurações
│   └── seeds.py          # Dados iniciais
└── frontend/
    ├── src/
    │   ├── components/   # Componentes reutilizáveis
    │   ├── pages/        # Páginas da aplicação
    │   ├── services/     # Integração com API
    │   ├── context/      # Context API (Auth)
    │   ├── routes/       # Configuração de rotas
    │   └── layouts/      # Layouts da aplicação
    └── public/           # Arquivos estáticos
```

## 🎯 Funcionalidades Principais

### Para Pacientes
- ✅ Login via CPF e senha
- ✅ Visualização de procedimentos agendados
- ✅ Upload de documentos (PDF, JPG, PNG)
- ✅ Acompanhamento do status de documentos
- ✅ Primeiro acesso com OTP via email

### Para Profissionais
- ✅ Login via CPF/email e senha
- ✅ Lista de documentos pendentes de análise
- ✅ Visualização de PDFs no navegador
- ✅ Qualificação de documentos (aprovar/rejeitar)
- ✅ Adição de observações clínicas

### Para Secretária
- ✅ Login via email e senha
- ✅ Upload de CSV para cadastro em massa
- ✅ Histórico de uploads realizados
- ✅ Gestão de procedimentos

## 📝 Formato CSV para Upload

```csv
nome,cpf,email,procedimento,data,unidade
João Silva,123.456.789-00,joao@email.com,Consulta cardiológica,20/01/2026 09:00,Hospital Central
Maria Santos,987.654.321-00,maria@email.com,Exame de sangue,21/01/2026 14:30,Clínica Lab
```
