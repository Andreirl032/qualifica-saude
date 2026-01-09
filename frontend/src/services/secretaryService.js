import { get } from './apiClient.js'

export function fetchCsvHistory() {
  return get('/secretary/csv-history').then((res) => res.data ?? res)
}

export async function uploadCsv(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  const authData = localStorage.getItem('qs.auth')
  const accessToken = authData ? JSON.parse(authData).accessToken : ''
  
  const response = await fetch(`${baseUrl}/secretary/upload-csv`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erro ao enviar CSV')
  }
  
  return response.json()
}
