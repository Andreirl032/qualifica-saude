import { useEffect, useMemo, useState } from "react";
import {
  getPatientProcedures,
  uploadPatientDocument,
} from "../services/documentService.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Alert } from "../components/Alert.jsx";
import { Badge } from "../components/Badge.jsx";
import { Button } from "../components/Button.jsx";
import { faFileArrowUp } from "@fortawesome/free-solid-svg-icons";
import { BrButton } from "@govbr-ds/webcomponents-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const statusLabels = {
  "pendente-documentos": "Documentos pendentes",
  "aguardando-analise": "Aguardando análise",
  agendado: "Agendado",
  completo: "Concluído",
};

const docStatusLabels = {
  pendente: "Pendente de envio",
  enviado: "Enviado, aguardando análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

function statusBadgeVariant(status) {
  switch (status) {
    case "pendente-documentos":
    case "pendente":
      return "warning";
    case "aguardando-analise":
    case "enviado":
      return "info";
    case "aprovado":
    case "completo":
      return "success";
    case "rejeitado":
      return "error";
    default:
      return "default";
  }
}

export default function PatientHomePage() {
  const [procedures, setProcedures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useState({})[0];

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setIsLoading(true);
        const list = await getPatientProcedures();
        if (!active) return;
        setProcedures(Array.isArray(list) ? list : []);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(
          e?.response?.data?.message ||
            e.message ||
            "Não foi possível carregar seus procedimentos."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const pendingDocuments = useMemo(() => {
    const items = [];
    for (const proc of procedures) {
      for (const doc of proc.requiredDocuments || []) {
        if (doc.status === "pendente" || doc.status === "rejeitado") {
          items.push({ procedure: proc, document: doc });
        }
      }
    }
    return items;
  }, [procedures]);

  function handleUploadClick(procedureId, documentId) {
    const key = `${procedureId}:${documentId}`;
    if (!fileInputRef[key]) {
      fileInputRef[key] = document.createElement("input");
      fileInputRef[key].type = "file";
      fileInputRef[key].accept = ".pdf,.jpg,.jpeg,.png";
      fileInputRef[key].onchange = (e) =>
        handleFileSelected(procedureId, documentId, e.target.files[0]);
    }
    fileInputRef[key].click();
  }

  async function handleFileSelected(procedureId, documentId, file) {
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      window.alert("Arquivo muito grande. Tamanho máximo: 10MB");
      return;
    }

    try {
      setUploadingId(`${procedureId}:${documentId}`);
      const updated = await uploadPatientDocument(
        procedureId,
        documentId,
        file
      );
      setProcedures((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      window.alert(
        "Documento enviado com sucesso! Será analisado pela equipe em breve."
      );
    } catch (e) {
      window.alert(
        e?.response?.data?.message || e.message || "Falha ao enviar documento."
      );
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-6 p-10">
      {/* <PageHeader
        title="Área do Paciente"
        subtitle="Veja abaixo seus procedimentos e quais documentos ainda precisam ser enviados para a equipe de saúde."
        align="left"
      /> */}
      <h1 class="text-3xl leading-16 font-semibold text-[#0c326f] pb-2.5 m-0 text-left">
          Área do Paciente
      </h1>
      <h2 className="align-left">Veja abaixo seus procedimentos e quais documentos ainda precisam ser enviados para a equipe de saúde.</h2>

      {error && (
        <Alert variant="error">
          <span>{error}</span>
        </Alert>
      )}

      <section className="card bg-base-100 shadow-md">
        <div className="card-body space-y-4 p-0">
          <div className="collapse collapse-arrow w-full">
          <input type="checkbox" />
          <div className="flex items-center justify-between gap-2 collapse-title">
            <div>
              <h2 className="card-title">Documentos pendentes ({pendingDocuments.length})</h2>
              <p className="text-sm text-base-content/70">
                Envie o que estiver faltando para não atrasar seu procedimento.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center opacity-70">
              <span className="loading loading-spinner loading-md mr-4"></span>
              Carregando seus documentos...
            </div>
          ) : pendingDocuments.length === 0 ? (
            <Alert variant="success">
              <span>Você não tem documentos pendentes no momento.</span>
            </Alert>
          ) : (
            <div className="overflow-x-auto collapse-content">
              <table className="table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th>Documento</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDocuments.map(({ procedure, document }) => {
                    const key = `${procedure.id}:${document.id}`;
                    return (
                      <tr key={key} className="hover:bg-gray-100 transition-all">
                        <td>
                          <div className="font-medium">{procedure.name}</div>
                          <div className="text-xs text-base-content/70">
                            {procedure.date} · {procedure.facility}
                          </div>
                        </td>
                        <td>{document.name}</td>
                        <td>
                          <Badge variant={statusBadgeVariant(document.status)}>
                            {docStatusLabels[document.status] ||
                              document.status}
                          </Badge>
                        </td>
                        <td>
                          {/* <Button
                            variant="primary"
                            className="btn-sm"
                            isLoading={uploadingId === key}
                            onClick={()=>handleUploadClick(procedure.id, document.id)}
                            disabled={uploadingId === key}
                            icon={faFileArrowUp}
                          >
                            {uploadingId === key ? "Enviando..." : "Enviar documento"}
                          </Button> */}
                          <BrButton emphasis="primary" className={`btn-sm ${uploadingId === key ? "loading" : ""}`} disabled={uploadingId === key} onClick={()=>handleUploadClick(procedure.id, document.id)}>
                          <FontAwesomeIcon icon={faFileArrowUp} className="mr-2" />
                          {uploadingId === key ? "Enviando..." : "Enviar documento"}
                          </BrButton>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </section>

      <section className="card bg-base-100 shadow-md">
        <div className="card-body space-y-4 p-0">
          <div className="collapse collapse-arrow w-full">
            <input type="checkbox" />
          <div className="flex items-center justify-between gap-2 collapse-title">
            <div>
              <h2 className="card-title">Meus procedimentos ({procedures.length})</h2>
              <p className="text-sm text-base-content/70">
                Resumo dos procedimentos agendados e já concluídos.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center opacity-70">
              <span className="loading loading-spinner loading-md mr-4"></span>
              Carregando seus procedimentos...
            </div>
          ) : procedures.length === 0 ? (
            <Alert>
              <span>Você ainda não possui procedimentos cadastrados.</span>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 collapse-content">
              {procedures.map((proc) => (
                <article
                  key={proc.id}
                  className="card bg-base-100 border border-base-200 hover:bg-gray-100 transition-all"
                >
                  <div className="card-body space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{proc.name}</h3>
                        <p className="text-xs text-base-content/70">
                          {proc.facility}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(proc.status)}>
                        {statusLabels[proc.status] || proc.status}
                      </Badge>
                    </div>
                    <p className="text-sm">{proc.date}</p>
                    <div className="divider my-2" />
                    <p className="text-xs font-semibold mb-1">
                      Documentos deste procedimento
                    </p>
                    <ul className="space-y-1 text-sm flex flex-col gap-8">
                      {(proc.requiredDocuments || []).map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <div>
                            <span>{doc.name}</span>
                            {doc.lastUpload && (
                              <div className="text-[11px] text-base-content/60">
                                Último envio:{" "}
                                {new Date(
                                  doc.lastUpload.uploadedAt
                                ).toLocaleString()}{" "}
                                ({doc.lastUpload.fileName})
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={statusBadgeVariant(doc.status)}
                              size="md"
                            >
                              {docStatusLabels[doc.status] || doc.status}
                            </Badge>
                            {(doc.status === "pendente" ||
                              doc.status === "rejeitado") && (
                          //       <Button
                          //       variant=""
                          //   className="btn btn-xs btn-outline"
                          //   onClick={() => handleUploadClick(proc.id, doc.id)}
                          //   icon={faFileArrowUp}
                          // >
                          //   Enviar
                          // </Button>
                          <BrButton emphasis="primary" onClick={() => handleUploadClick(proc.id, doc.id)}>
                          <FontAwesomeIcon icon={faFileArrowUp} className="mr-2" />
                          Enviar
                          </BrButton>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        </div>
      </section>
    </div>
  );
}
