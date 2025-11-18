import { post } from './apiClient.js'

export async function login({ email, password }) {
  return post('/auth/login', { email, password })
}

export async function loginByCpf({ cpf, password }) {
  return post('/auth/login-cpf', { cpf, password })
}

export async function requestOtp({ cpf }) {
  return post('/auth/request-otp', { cpf })
}

export async function setPassword(payload) {
  return post('/auth/set-password', payload)
}

export async function register(payload) {
  return post('/auth/register', payload)
}
