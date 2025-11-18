import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService.js'
import { setAuthAccessors } from '../services/apiClient.js'

const AuthContext = createContext(null)

const storageKey = 'qs.auth'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : { user: null, accessToken: null, refreshToken: null }
    } catch {
      return { user: null, accessToken: null, refreshToken: null }
    }
  })

  const persist = useCallback((next) => {
    setAuth(next)
    localStorage.setItem(storageKey, JSON.stringify(next)) 
  }, [])

  const setTokens = useCallback((tokens) => {
    persist({ ...auth, ...tokens })
  }, [auth, persist])

  const getTokens = useCallback(() => ({ accessToken: auth.accessToken, refreshToken: auth.refreshToken }), [auth])

  const isAuthenticated = !!auth?.user && !!auth?.accessToken

  const login = useCallback(async ({ email, password }) => {
    const resp = await authService.login({ email, password })
    persist({ user: resp.user, accessToken: resp.accessToken, refreshToken: resp.refreshToken })
    return resp.user
  }, [persist])

  const loginWithCpf = useCallback(async ({ cpf, password }) => {
    const resp = await authService.loginByCpf({ cpf, password })
    persist({ user: resp.user, accessToken: resp.accessToken, refreshToken: resp.refreshToken })
    return resp.user
  }, [persist])

  const register = useCallback(async (payload) => {
    const resp = await authService.register(payload)
    return resp
  }, [])

  const logout = useCallback(() => {
    persist({ user: null, accessToken: null, refreshToken: null })
  }, [persist])

  useEffect(() => {
    setAuthAccessors({ getTokens, setTokens, logout })
  }, [getTokens, setTokens, logout])

  const value = useMemo(() => ({
    user: auth.user,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    isAuthenticated,
    login,
    loginWithCpf,
    register,
    logout,
    setTokens,
    getTokens,
  }), [auth, getTokens, isAuthenticated, login, loginWithCpf, logout, register, setTokens])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
