import { post } from './apiClient.js'

export async function login({ email, password }) {
  return post('/auth/login', { email, password })
}

export async function register(payload) {
  return post('/auth/register', payload)
}
