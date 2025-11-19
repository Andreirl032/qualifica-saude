import { useEffect, useState } from 'react'
import { fetchCsvHistory } from '../services/secretaryService.js'

export default function SecretaryDashboard() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [historyError, setHistoryError] = useState(null)

  useEffect(() => {
    let active = true
    async function loadHistory() {
      try {
        setIsLoading(true)
        const data = await fetchCsvHistory()
        if (!active) return
        setHistory(Array.isArray(data) ? data : [])
        setHistoryError(null)
      } catch (error) {
        if (!active) return
        setHistory([])
        setHistoryError(error.message || 'Não foi possível carregar o histórico.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadHistory()
    return () => {
      active = false
    }
  }, [])

  const handleImportClick = () => {
    alert('Importação mockada: simulando leitura de CSV dos pacientes.')
  }

  const handleExportClick = () => {
    alert('Exportação mockada: simulando download do CSV com os pacientes.')
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Painel do Secretário</h1>
      </header>

      <div className="card bg-base-100 shadow">
        <div className="card-body flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <span className="font-semibold">Importar CSV (mock)</span>
            <p className="text-sm text-base-content/70">
              Clique para simular a leitura de um arquivo CSV contendo os pacientes agendados para procedimentos.
            </p>
            <button className="btn btn-primary w-fit" onClick={handleImportClick}>
              Importar CSV mockado
            </button>
          </div>
          <div className="flex-1 space-y-2">
            <span className="font-semibold">Exportar CSV (mock)</span>
            <p className="text-sm text-base-content/70">
              Clique para simular o download do CSV com os dados atuais dos pacientes.
            </p>
            <button className="btn btn-outline w-fit" onClick={handleExportClick}>
              Exportar CSV mockado
            </button>
          </div>
        </div>
      </div>

      <section className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <div>
            <h2 className="card-title">Histórico de envios CSV</h2>
            <p className="text-sm text-base-content/70">Dados mockados servidos pelo MSW.</p>
          </div>
          {historyError && (
            <div className="alert alert-error">
              <span>{historyError}</span>
            </div>
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
                        <span className={`badge ${entry.status === 'Sucesso' ? 'badge-success' : 'badge-error'}`}>
                          {entry.status}
                        </span>
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
