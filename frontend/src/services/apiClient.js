import axios from 'axios'

let accessors = {
  getTokens: () => ({ accessToken: null, refreshToken: null }),
  setTokens: () => {},
  logout: () => {},
}

export function setAuthAccessors(a) {
  accessors = a
}

function getBaseUrl() {
  const base = import.meta.env.VITE_API_URL || ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

const api = axios.create({
  baseURL: getBaseUrl() || '/',
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise = null

async function doRefresh() {
  if (!refreshPromise) {
    const { refreshToken } = accessors.getTokens()
    refreshPromise = api
      .post('/auth/refresh', { refreshToken })
      .then((res) => {
        const data = res.data || {}
        accessors.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? refreshToken })
        return data
      })
      .catch((e) => {
        accessors.logout()
        throw e
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const { accessToken } = accessors.getTokens()
  if (accessToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error || {}
    if (response && response.status === 401 && !config.__isRetryRequest) {
      try {
        await doRefresh()
        config.__isRetryRequest = true
        return api.request(config)
      } catch (e) {
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  }
)

export async function get(path, config) {
  const res = await api.get(path, config)
  return res.data
}

export async function post(path, body, config) {
  const res = await api.post(path, body, config)
  return res.data
}

export async function put(path, body, config) {
  const res = await api.put(path, body, config)
  return res.data
}

export async function del(path, config) {
  const res = await api.delete(path, config)
  return res.data
}
