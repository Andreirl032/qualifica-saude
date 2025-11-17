import { http, HttpResponse, delay } from 'msw'

// Banco em memória para mock
const db = {
  users: [
    { id: 'u1', name: 'Andrei Paciente', email: 'paciente@demo.com', role: 'paciente', password: '123456' },
    { id: 'u2', name: 'João Profissional', email: 'profissional@demo.com', role: 'profissional', password: '123456' },
    { id: 'u3', name: 'Augusto Secretário', email: 'secretario@demo.com', role: 'secretario', password: '123456' },
  ],
  tokens: new Map(), // refreshToken -> { userId, accessToken }
}

function makeToken(prefix, userId) {
  return `${prefix}.${btoa(`${userId}.${Date.now()}`)}`
}

function findUserByEmail(email) {
  return db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
}

function publicUser(u) {
  const { password, ...rest } = u
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
    const accessToken = makeToken('access', user.id)
    const refreshToken = makeToken('refresh', user.id)
    db.tokens.set(refreshToken, { userId: user.id, accessToken })
    return HttpResponse.json({ user: publicUser(user), accessToken, refreshToken })
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
    db.users.push({ id, name: body.name ?? 'Usuário', email: body.email, role: body.role, password: body.password ?? '123456' })
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
]
