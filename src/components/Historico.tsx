import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  resumoPorProva,
  exportarSave,
  importarSave,
  limparHistorico,
} from "../lib/resultados";
import {
  ArrowLeft,
  DownloadSimple,
  UploadSimple,
  Trash,
} from "@phosphor-icons/react";
import type { ResumoProva } from "../tipos";

interface HistoricoProps {
  onVoltar: () => void;
}

// Histórico: melhor nota e nº de tentativas por prova, com exportar/importar o
// arquivo de save (.json) pra levar entre computadores.
export default function Historico({ onVoltar }: HistoricoProps) {
  const [resumos, setResumos] = useState<ResumoProva[]>(resumoPorProva());
  const [mensagem, setMensagem] = useState<string | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  const exportarHistorico = () => {
    const blob = new Blob([exportarSave()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "simulado-save.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importarHistorico = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        if (typeof leitor.result !== "string")
          throw new Error("arquivo inválido");
        const quantidadeImportada = importarSave(leitor.result);
        setResumos(resumoPorProva());
        setMensagem(`${quantidadeImportada} resultado(s) importado(s).`);
      } catch {
        setMensagem("save inválido.");
      }
    };
    leitor.readAsText(arquivo);
  };

  const limparTodoHistorico = () => {
    limparHistorico();
    setResumos([]);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4 animar-entrada">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onVoltar}
          className="text-muted hover:text-tinta flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={16} /> início
        </button>
        <h1 className="text-lg font-bold">Histórico</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportarHistorico}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-linha text-sm font-semibold hover:border-primaria transition"
          >
            <DownloadSimple size={16} /> exportar
          </button>
          <button
            onClick={() => inputArquivoRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-linha text-sm font-semibold hover:border-primaria transition"
          >
            <UploadSimple size={16} /> importar
          </button>
          <input
            ref={inputArquivoRef}
            type="file"
            accept="application/json,.json"
            onChange={importarHistorico}
            className="hidden"
          />
        </div>
      </div>

      {mensagem && <div className="text-sm text-muted">{mensagem}</div>}

      {resumos.length === 0 ? (
        <p className="text-muted text-center py-10">
          nenhum resultado ainda. faça uma prova!
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {resumos.map((resumoProva) => (
            <div
              key={resumoProva.provaId}
              className="rounded-xl bg-cartao border border-linha p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{resumoProva.titulo}</div>
                <div className="text-sm text-muted">
                  {resumoProva.tentativas} tentativa(s) · última{" "}
                  {new Date(resumoProva.ultima ?? "").toLocaleDateString(
                    "pt-BR",
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-primaria tabular-nums">
                  {resumoProva.melhor}%
                </div>
                <div className="text-[11px] text-muted uppercase tracking-wider">
                  melhor
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={limparTodoHistorico}
            className="self-center mt-2 flex items-center gap-1.5 text-sm text-erro hover:underline"
          >
            <Trash size={15} /> limpar histórico
          </button>
        </div>
      )}
    </main>
  );
}
