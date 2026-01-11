import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader.jsx";
import { ButtonLink } from "../components/ButtonLink.jsx";
import { Badge } from "../components/Badge.jsx";
import { Alert } from "../components/Alert.jsx";
import { Button } from "../components/Button.jsx";
import { getProfessionalDocuments } from "../services/documentService.js";

import { faArrowsSpin } from "@fortawesome/free-solid-svg-icons";
import { BrButton } from "@govbr-ds/webcomponents-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch (e) {
    return value;
  }
}

function statusVariant(status) {
  if (status === "pendente") return "warning";
  if (status === "aprovado") return "success";
  if (status === "rejeitado") return "error";
  return "default";
}

function priorityVariant(priority) {
  if (priority === "alta") return "error";
  if (priority === "media") return "warning";
  if (priority === "baixa") return "info";
  return "default";
}

export default function ProfessionalHomePage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProfessionalDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Falha ao buscar documentos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const { pending, completed } = useMemo(() => {
    const pendingDocs = [];
    const completedDocs = [];
    documents.forEach((doc) => {
      if (doc.status === "enviado") {
        pendingDocs.push(doc);
      } else {
        completedDocs.push(doc);
      }
    });
    return { pending: pendingDocs, completed: completedDocs };
  }, [documents]);

  return (
    <div className="space-y-6 p-10 gap-15 flex-col flex">
      {/* <PageHeader
        align="left"
        title="Documentos para qualificação"
        subtitle="Acompanhe os envios mais recentes e finalize as pendências dos pacientes."
      /> */}
      <div>
      <div className="mb-5">
      <h1 class="text-3xl leading-16 font-semibold text-[#0c326f] pb-0 m-0 text-left">
          Documentos para qualificação
      </h1>
      <h2 className="align-left">Acompanhe os envios mais recentes e finalize as pendências dos pacientes.</h2>
      </div>
      

      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-sm text-base-content/70">
            Total de documentos: {documents.length}
          </p>
          <p className="text-sm text-base-content/70">
            Pendentes: {pending.length}
          </p>
        </div>
        {/* <Button
          type="button"
          variant="outline"
          onClick={loadDocuments}
          icon={faArrowsSpin}
        >
          Atualizar lista
        </Button> */}
        <BrButton
          emphasis="primary"  // "primary" para azul, "secondary" para contorno
          onClick={loadDocuments}
        >
          <FontAwesomeIcon icon={faArrowsSpin} className="mr-2" />
          Atualizar lista
        </BrButton>

      </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {isLoading ? (
        <div className="text-center py-12 text-base-content/70">
          Carregando documentos...
        </div>
      ) : (
        <div className="space-y-8 gap-15 flex-col flex">
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-300 mb-6 pb-2">
              <h2 className="text-lg font-semibold">Pendentes para análise</h2>
              <Badge variant="warning">{pending.length} pendentes</Badge>
            </div>
            {pending.length === 0 ? (
              <Alert variant="info">
                Nenhum documento aguarda qualificação neste momento.
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Documento</th>
                      <th>Procedimento</th>
                      <th>Recebido em</th>
                      <th>Prioridade</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="font-semibold">{doc.patientName}</div>
                          <div className="text-xs text-base-content/70">
                            CPF {doc.patientCpf}
                          </div>
                        </td>
                        <td>
                          <div>{doc.documentName}</div>
                          <p className="text-xs text-base-content/70 max-w-xs">
                            {doc.pendingReason || doc.notes}
                          </p>
                        </td>
                        <td>{doc.procedureName}</td>
                        <td>
                          <div>{formatDateTime(doc.receivedAt)}</div>
                          <p className="text-xs text-base-content/70">
                            Atualizado {formatDateTime(doc.lastUpdate)}
                          </p>
                        </td>
                        <td>
                          <Badge
                            variant={priorityVariant(doc.priority)}
                            className="uppercase"
                          >
                            {doc.priority || "normal"}
                          </Badge>
                        </td>
                        <td>
                          <ButtonLink
                            to={`/paciente/qualificacao-documento/${doc.id}`}
                            variant="primary"
                          >
                            Qualificar
                          </ButtonLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-300 mb-6 pb-2">
              <h2 className="text-lg font-semibold">Histórico recente</h2>
              <Badge variant="info">{completed.length} concluídos</Badge>
            </div>
            {completed.length === 0 ? (
              <Alert variant="info">
                Ainda não há documentos aprovados ou rejeitados.
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-compact">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Paciente</th>
                      <th>Status</th>
                      <th>Última atualização</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.documentName}</td>
                        <td>
                          <div className="font-semibold">{doc.patientName}</div>
                          <div className="text-xs text-base-content/70">
                            {doc.procedureName}
                          </div>
                        </td>
                        <td>
                          <Badge
                            variant={statusVariant(doc.status)}
                            className="capitalize"
                          >
                            {doc.status}
                          </Badge>
                        </td>
                        <td>{formatDateTime(doc.lastUpdate)}</td>
                        <td className="max-w-sm text-sm text-base-content/80">
                          {doc.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
