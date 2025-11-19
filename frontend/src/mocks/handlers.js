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
  patientProcedures: [
    {
      id: 'proc1',
      patientId: 'u1',
      name: 'Cirurgia de joelho direito',
      date: '20/11/2025 08:00',
      facility: 'Hospital Municipal Demo',
      status: 'pendente-documentos',
      requiredDocuments: [
        { id: 'doc1', name: 'Risco cirúrgico', status: 'pendente', type: 'pdf' },
        { id: 'doc2', name: 'Exame de sangue recente', status: 'aprovado', type: 'pdf' },
      ],
    },
    {
      id: 'proc2',
      patientId: 'u1',
      name: 'Endoscopia digestiva',
      date: '25/11/2025 14:30',
      facility: 'Clínica Especializada Demo',
      status: 'agendado',
      requiredDocuments: [
        { id: 'doc3', name: 'Consentimento informado assinado', status: 'pendente', type: 'pdf' },
      ],
    },
    {
      id: 'proc3',
      patientId: 'u1',
      name: 'Consulta de retorno',
      date: '10/12/2025 10:00',
      facility: 'Ambulatório Demo',
      status: 'completo',
      requiredDocuments: [
        { id: 'doc4', name: 'Relatório de alta', status: 'aprovado', type: 'pdf' },
      ],
    },
  ],
  professionalDocuments: [
    {
      id: 'doc-101',
      patientName: 'Andrei Paciente',
      patientCpf: '123.123.123-12',
      procedureName: 'Cirurgia de joelho direito',
      documentName: 'Risco cirúrgico',
      status: 'pendente',
      receivedAt: '2025-11-16T09:10:00',
      lastUpdate: '2025-11-16T09:10:00',
      attachments: [{ fileName: 'risco-cirurgico.pdf', url: '#' }],
      notes: 'Paciente relata alergia a analgésicos. Avaliar laudo.',
      pendingReason: 'Documento obrigatório antes do agendamento',
      priority: 'alta',
    },
    {
      id: 'doc-102',
      patientName: 'Carla Souza',
      patientCpf: '555.444.333-22',
      procedureName: 'Endoscopia digestiva',
      documentName: 'Consentimento informado',
      status: 'pendente',
      receivedAt: '2025-11-15T14:35:00',
      lastUpdate: '2025-11-17T08:05:00',
      attachments: [{ fileName: 'consentimento.pdf', url: '#' }],
      notes: 'Revisar assinatura do responsável.',
      pendingReason: 'Assinatura pouco legível no rodapé',
      priority: 'media',
    },
    {
      id: 'doc-103',
      patientName: 'Luan Pereira',
      patientCpf: '987.654.321-00',
      procedureName: 'Tomografia computadorizada',
      documentName: 'Exame de creatinina',
      status: 'aprovado',
      receivedAt: '2025-11-10T10:15:00',
      lastUpdate: '2025-11-10T11:00:00',
      attachments: [{ fileName: 'creatinina.pdf', url: '#' }],
      notes: 'Resultado dentro da faixa.',
      pendingReason: null,
      priority: 'baixa',
    },
    {
      id: 'doc-104',
      patientName: 'Marta Oliveira',
      patientCpf: '321.654.987-00',
      procedureName: 'Consulta pré-operatória',
      documentName: 'Lista de medicamentos',
      status: 'rejeitado',
      receivedAt: '2025-11-12T16:20:00',
      lastUpdate: '2025-11-13T09:40:00',
      attachments: [{ fileName: 'medicamentos.docx', url: '#' }],
      notes: 'Anexado documento ilegível. Solicitar novo upload.',
      pendingReason: null,
      priority: 'baixa',
    },
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

function maskEmail(email = '') {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email
  const [local, domain] = email.split('@')
  if (local.length <= 3) {
    const first = local[0] ?? ''
    return `${first}***@${domain}`
  }
  const first = local[0]
  const last3 = local.slice(-3)
  return `${first}*****${last3}@${domain}`
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

  http.post('/auth/contact-hint', async ({ request }) => {
    const body = await request.json()
    await delay(200)
    const user = findUserByCpf(body.cpf)
    if (!user || user.role === 'secretario') {
      return HttpResponse.json({ message: 'CPF não encontrado para este fluxo' }, { status: 404 })
    }
    return HttpResponse.json({
      ok: true,
      contactHint: maskEmail(user.email),
    })
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
    const emailToMask = body.email || user.email
    return HttpResponse.json({
      ok: true,
      hasPassword: Boolean(user.password),
      expiresInSeconds: OTP_EXPIRATION_MS / 1000,
      otpPreview: code,
      contactHint: maskEmail(emailToMask),
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

  // Lista de procedimentos do paciente logado
  http.get('/patient/procedures', async ({ request }) => {
    await delay(250)
    const auth = request.headers.get('authorization') || ''
    if (!auth.startsWith('Bearer access.')) {
      return HttpResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }
    const procedures = db.patientProcedures.filter((p) => p.patientId === 'u1')
    return HttpResponse.json({ data: procedures })
  }),

  http.get('/professional/documents', async ({ request }) => {
    await delay(220)
    const auth = request.headers.get('authorization') || ''
    if (!auth.startsWith('Bearer access.')) {
      return HttpResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }
    return HttpResponse.json({ data: db.professionalDocuments })
  }),

  // Upload de documento do paciente
  http.post('/patient/procedures/:procedureId/documents/:documentId/upload', async ({ params, request }) => {
    await delay(400)
    const auth = request.headers.get('authorization') || ''
    if (!auth.startsWith('Bearer access.')) {
      return HttpResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }
    const { procedureId, documentId } = params
    const body = await request.json()
    const procedure = db.patientProcedures.find((p) => p.id === procedureId)
    if (!procedure) {
      return HttpResponse.json({ message: 'Procedimento não encontrado' }, { status: 404 })
    }
    const doc = procedure.requiredDocuments.find((d) => d.id === documentId)
    if (!doc) {
      return HttpResponse.json({ message: 'Documento não encontrado' }, { status: 404 })
    }
    if (!body || !body.fileName) {
      return HttpResponse.json({ message: 'Arquivo inválido' }, { status: 400 })
    }
    doc.status = 'enviado'
    doc.lastUpload = {
      fileName: body.fileName,
      uploadedAt: new Date().toISOString(),
    }
    if (procedure.requiredDocuments.every((d) => d.status === 'aprovado' || d.status === 'enviado')) {
      procedure.status = 'aguardando-analise'
    }
    return HttpResponse.json({ ok: true, procedure })
  }),
]
