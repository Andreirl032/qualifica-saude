import { useEffect, useState, useRef } from 'react'
import { fetchCsvHistory, uploadCsv } from '../services/secretaryService.js'
import { PageHeader } from '../components/PageHeader.jsx'
import { Button } from '../components/Button.jsx'
import { Alert } from '../components/Alert.jsx'
import { Badge } from '../components/Badge.jsx'

export default function SecretaryDashboard() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [historyError, setHistoryError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    try {
      setIsLoading(true)
      const data = await fetchCsvHistory()
      setHistory(Array.isArray(data) ? data : [])
      setHistoryError(null)
    } catch (error) {
      setHistory([])
      setHistoryError(error.message || 'Não foi possível carregar o histórico.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setUploadError('Apenas arquivos CSV são aceitos.')
      setUploadSuccess(null)
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)
      setUploadSuccess(null)

      const result = await uploadCsv(file)
      
      setUploadSuccess(result.message || 'CSV processado com sucesso!')
      if (result.errors && result.errors.length > 0) {
        setUploadError(`Avisos: ${result.errors.join(', ')}`)
      }
      
      await loadHistory()
    } catch (error) {
      setUploadError(error.message || 'Erro ao enviar arquivo CSV.')
      setUploadSuccess(null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExportClick = () => {
    const csvContent = [
      'Arquivo,Linhas,Resultado,Data/Hora',
      ...history.map(entry => 
        `"${entry.filename}",${entry.rows},"${entry.status}","${entry.timestamp}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `historico-csv-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Painel do Secretário" align="left" />

      {uploadSuccess && (
        <Alert variant="success">
          <span>{uploadSuccess}</span>
        </Alert>
      )}

      {uploadError && (
        <Alert variant="error">
          <span>{uploadError}</span>
        </Alert>
      )}

      <div className="card bg-base-100 shadow-md">
        <div className="card-body flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <span className="font-semibold">Importar CSV</span>
            <p className="text-sm text-base-content/70">
              Faça upload de um arquivo CSV contendo os pacientes e procedimentos.
              <br />
              <span className="text-xs">Formato: nome,cpf,email,procedimento,data,unidade</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button 
              variant="primary" 
              onClick={handleImportClick}
              disabled={isUploading}
            >
              {isUploading ? 'Enviando...' : 'Importar CSV'}
            </Button>
          </div>
          <div className="flex-1 space-y-2">
            <span className="font-semibold">Exportar histórico</span>
            <p className="text-sm text-base-content/70">
              Faça download do histórico de uploads em formato CSV.
            </p>
            <Button 
              variant="outline" 
              onClick={handleExportClick}
              disabled={history.length === 0}
            >
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      <section className="card bg-base-100 shadow-md">
        <div className="card-body space-y-4">
          <div>
            <h2 className="card-title">Histórico de envios CSV</h2>
            <p className="text-sm text-base-content/70">Registros de processamento de arquivos CSV.</p>
          </div>
          {historyError && (
            <Alert variant="error">
              <span>{historyError}</span>
            </Alert>
          )}
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Linhas</th>
                  <th>Resultado</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center opacity-70">
                      Carregando histórico...
                    </td>
                  </tr>
                ) : history.length ? (
                  history.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.filename}</td>
                      <td>{entry.rows}</td>
                      <td>
                        <Badge variant={entry.status === 'Sucesso' ? 'success' : 'error'}>
                          {entry.status}
                        </Badge>
                      </td>
                      <td>{entry.timestamp}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center opacity-70">
                      Nenhum histórico encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
