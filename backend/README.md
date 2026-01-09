# Qualifica Saúde - Backend API

## Stack

- Python 3.11+
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- PostgreSQL
- bcrypt
- Pydantic

## Setup

### 1. Criar banco de dados PostgreSQL

```bash
createdb qualifica_saude
```

Ou via psql:
```sql
CREATE DATABASE qualifica_saude;
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

```bash
cp .env.example .env
```

Edite `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qualifica_saude
JWT_SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5173
SQLALCHEMY_ECHO=False
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Popular banco de dados

```bash
python seeds.py
```

Isso criará:
- 4 usuários (paciente, profissional, secretário, paciente sem senha)
- 3 procedimentos para o paciente
- 4 documentos requeridos
- 4 documentos profissionais
- 3 registros de histórico CSV

### 5. Executar servidor

```bash
python app.py
```

Servidor rodando em `http://localhost:5000`

## Endpoints

### Autenticação

- `POST /auth/login` - Login via email/senha (secretário)
- `POST /auth/login-cpf` - Login via CPF/senha (paciente/profissional)
- `POST /auth/contact-hint` - Validar email mascarado
- `POST /auth/request-otp` - Solicitar código OTP
- `POST /auth/set-password` - Definir senha usando OTP
- `POST /auth/refresh` - Renovar access token
- `POST /auth/register` - Registrar novo usuário

### Documentos

- `POST /documents/:id/qualify` - Qualificar documento
- `GET /patient/procedures` - Listar procedimentos do paciente
- `GET /professional/documents` - Listar documentos para qualificação
- `POST /patient/procedures/:p/documents/:d/upload` - Upload de documento

### Secretaria

- `GET /secretary/csv-history` - Histórico de uploads CSV
- `POST /secretary/upload-csv` - Upload e processamento de arquivo CSV

#### Upload de CSV

O endpoint aceita arquivos CSV com o seguinte formato:

```csv
nome,cpf,email,procedimento,data,unidade
João Silva,123.456.789-00,joao@email.com,Consulta cardiológica,20/01/2026 09:00,Hospital Central
```

**Campos obrigatórios:**
- `nome`: Nome completo do paciente
- `cpf`: CPF (com ou sem formatação)
- `email`: Email do paciente
- `procedimento`: Nome do procedimento
- `data`: Data e hora do procedimento
- `unidade`: Unidade de saúde

**Comportamento:**
- Se o CPF já existe, o usuário não é recriado
- Se o paciente não tem senha, será necessário definir no primeiro acesso
- Cada linha cria um procedimento vinculado ao paciente
- O histórico é registrado na tabela `csv_history`
- Arquivo de exemplo disponível em `example_patients.csv`

## Usuários de Teste

| Email/CPF | Senha | Role |
|-----------|-------|------|
| `paciente@demo.com` ou `12312312312` | `123456` | paciente |
| `profissional@demo.com` ou `22222222222` | `123456` | profissional |
| `secretario@demo.com` | `123456` | secretario |
| `primeiro@demo.com` ou `44444444444` | (sem senha) | paciente |

## Regras de Negócio

- Secretários só podem logar via email
- Pacientes/Profissionais podem logar via CPF ou email
- OTP expira em 5 minutos
- Senha mínima de 6 caracteres
- CPF é normalizado (remove máscara)
- Email é mascarado para segurança
