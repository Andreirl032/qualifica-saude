import { get, post } from './apiClient.js'

export async function getDocumentDetails(documentoId) {
  const response = await get(`/documents/${documentoId}`)
  return response
}

export function getDocumentFileUrl(documentoId) {
  // Buscar token do localStorage onde está armazenado
  const authData = localStorage.getItem('qs.auth')
  let token = null
  
  if (authData) {
    try {
      const parsed = JSON.parse(authData)
      token = parsed.accessToken
    } catch (e) {
      console.error('Erro ao parsear auth data:', e)
    }
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  return `${baseUrl}/documents/${documentoId}/file?token=${token || ''}`
}

export async function qualifyDocument(documentoId, payload) {
  return post(`/documents/${documentoId}/qualify`, payload)
}

export async function getPatientProcedures() {
  const response = await get('/patient/procedures')
  return response.data ?? []
}

export async function uploadPatientDocument(procedureId, documentId, file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await post(`/patient/procedures/${procedureId}/documents/${documentId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.procedure
}

export async function getProfessionalDocuments() {
  const response = await get('/professional/documents')
  return response.data ?? []
}
