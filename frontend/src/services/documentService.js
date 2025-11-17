import { post } from './apiClient.js'

export async function qualifyDocument(documentoId, payload) {
  return post(`/documents/${documentoId}/qualify`, payload)
}
