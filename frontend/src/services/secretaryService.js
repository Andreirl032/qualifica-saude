import { get } from './apiClient.js'

export function fetchCsvHistory() {
  return get('/secretary/csv-history').then((res) => res.data ?? res)
}
