import { get, post } from './apiClient.js'

export async function qualifyDocument(documentoId, payload) {
  return post(`/documents/${documentoId}/qualify`, payload)
}

export async function getPatientProcedures() {
  const response = await get('/patient/procedures')
  return response.data ?? []
}

export async function uploadPatientDocument(procedureId, documentId, fileName) {
  const response = await post(`/patient/procedures/${procedureId}/documents/${documentId}/upload`, { fileName })
  return response.procedure
}
