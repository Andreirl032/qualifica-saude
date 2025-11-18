import { http, HttpResponse, delay } from 'msw'

const OTP_EXPIRATION_MS = 5 * 60 * 1000

// Banco em memória para mock
const db = {
  users: [
    { id: 'u1', name: 'Andrei Paciente', email: 'paciente@demo.com', cpf: '12312312312', role: 'paciente', password: '123456' },
    { id: 'u2', name: 'João Profissional', email: 'profissional@demo.com', cpf: '22222222222', role: 'profissional', password: '123456' },
    { id: 'u3', name: 'Augusto Secretário', email: 'secretario@demo.com', cpf: '33333333333', role: 'secretario', password: '123456' },
    { id: 'u4', name: 'Paciente Sem Senha', email: 'primeiro@demo.com', cpf: '44444444444', role: 'paciente', password: null },
  ],
  tokens: new Map(), // refreshToken -> { userId, accessToken }
  otps: new Map(), // cpf -> { code, expiresAt }
  csvHistory: [
    { id: 1, filename: 'pacientes_2025-11-17.csv', rows: 32, status: 'Sucesso', timestamp: '17/11/2025 09:42' },
    { id: 2, filename: 'pacientes_correcao.csv', rows: 12, status: 'Sucesso', timestamp: '16/11/2025 15:21' },
    { id: 3, filename: 'lote_novembro.csv', rows: 45, status: 'Erro na validação', timestamp: '15/11/2025 18:07' },
  ],
}

function makeToken(prefix, userId) {
  return `${prefix}.${btoa(`${userId}.${Date.now()}`)}`
}

function normalizeCpf(cpf = '') {
  return String(cpf).replace(/\D/g, '')
}

function findUserByEmail(email) {
  return db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
}

function findUserByCpf(cpf) {
  const normalized = normalizeCpf(cpf)
  return db.users.find((u) => normalizeCpf(u.cpf) === normalized)
}

function issueTokens(user) {
  const accessToken = makeToken('access', user.id)
  const refreshToken = makeToken('refresh', user.id)
  db.tokens.set(refreshToken, { userId: user.id, accessToken })
  return { user: publicUser(user), accessToken, refreshToken }
}

function publicUser(u) {
  const { password: _password, ...rest } = u
  return rest
}

export const handlers = [
  // Login
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json()
    await delay(300)
    const user = findUserByEmail(body.email)
    if (!user || user.password !== body.password) {
      return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }
    return HttpResponse.json(issueTokens(user))
  }),

  // Login via CPF
  http.post('/auth/login-cpf', async ({ request }) => {
    const body = await request.json()
    await delay(300)
    const user = findUserByCpf(body.cpf)
    if (!user) {
      return HttpResponse.json({ message: 'CPF não encontrado' }, { status: 404 })
    }
    if (!user.password) {
      return HttpResponse.json({ message: 'É necessário definir uma senha antes do primeiro acesso.' }, { status: 409 })
    }
    if (user.password !== body.password) {
      return HttpResponse.json({ message: 'Credenciais inválidas' }, { status: 401 })
    }
    if (user.role === 'secretario') {
      return HttpResponse.json({ message: 'CPF não permitido para este fluxo.' }, { status: 403 })
    }
    return HttpResponse.json(issueTokens(user))
  }),

  // Register
  http.post('/auth/register', async ({ request }) => {
    const body = await request.json()
    await delay(300)
    if (!['paciente', 'profissional', 'secretario'].includes(body.role)) {
      return HttpResponse.json({ message: 'Papel inválido' }, { status: 400 })
    }
    if (findUserByEmail(body.email)) {
      return HttpResponse.json({ message: 'E-mail já cadastrado' }, { status: 409 })
    }
    const id = `u${db.users.length + 1}`
    db.users.push({
      id,
      name: body.name ?? 'Usuário',
      email: body.email || "*****ro@hint.com",
      cpf: normalizeCpf(body.cpf) || `0000000000${id}`,
      role: body.role,
      password: body.password ?? '123456',
    })
    return HttpResponse.json({ ok: true })
  }),

  // Request OTP
  http.post('/auth/request-otp', async ({ request }) => {
    const body = await request.json()
    await delay(300)
    const user = findUserByCpf(body.cpf)
    if (!user || user.role === 'secretario') {
      return HttpResponse.json({ message: 'CPF não encontrado para este fluxo' }, { status: 404 })
    }
    const code = (Math.floor(100000 + Math.random() * 900000)).toString()
    db.otps.set(normalizeCpf(body.cpf), { code, expiresAt: Date.now() + OTP_EXPIRATION_MS })
    return HttpResponse.json({
      ok: true,
      hasPassword: Boolean(user.password),
      expiresInSeconds: OTP_EXPIRATION_MS / 1000,
      otpPreview: code,
      contactHint: user.phoneHint,
    })
  }),

  // Define password using OTP
  http.post('/auth/set-password', async ({ request }) => {
    const body = await request.json()
    await delay(300)
    const user = findUserByCpf(body.cpf)
    if (!user || user.role === 'secretario') {
      return HttpResponse.json({ message: 'CPF não encontrado' }, { status: 404 })
    }
    if (!body.password || body.password.length < 6) {
      return HttpResponse.json({ message: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 })
    }
    const otpEntry = db.otps.get(normalizeCpf(body.cpf))
    if (!otpEntry) {
      return HttpResponse.json({ message: 'Código expirado ou não solicitado' }, { status: 400 })
    }
    if (Date.now() > otpEntry.expiresAt) {
      db.otps.delete(normalizeCpf(body.cpf))
      return HttpResponse.json({ message: 'Código expirado' }, { status: 400 })
    }
    if (otpEntry.code !== body.otp) {
      return HttpResponse.json({ message: 'Código inválido' }, { status: 400 })
    }
    user.password = body.password
    db.otps.delete(normalizeCpf(body.cpf))
    return HttpResponse.json({ ok: true })
  }),

  // Refresh
  http.post('/auth/refresh', async ({ request }) => {
    const body = await request.json()
    await delay(200)
    const entry = db.tokens.get(body.refreshToken)
    if (!entry) return HttpResponse.json({ message: 'Refresh inválido' }, { status: 401 })
    const accessToken = makeToken('access', entry.userId)
    entry.accessToken = accessToken
    db.tokens.set(body.refreshToken, entry)
    return HttpResponse.json({ accessToken })
  }),

  http.post('/documents/:id/qualify', async ({ params, request }) => {
    await delay(300)
    const auth = request.headers.get('authorization') || ''
    if (!auth.startsWith('Bearer access.')) {
      return HttpResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }
    const id = params.id || 'current'
    const body = await request.json()
    if (!['aprovado', 'rejeitado'].includes(body.status)) {
      return HttpResponse.json({ message: 'Status inválido' }, { status: 400 })
    }
    return HttpResponse.json({ ok: true, id, ...body })
  }),

  http.get('/secretary/csv-history', async () => {
    await delay(200)
    return HttpResponse.json({ data: db.csvHistory })
  }),
]
