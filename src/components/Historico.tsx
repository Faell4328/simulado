import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  listarResultados,
  exportarSave,
  importarSave,
  limparHistorico,
} from "../lib/resultados";
import {
  ArrowLeft,
  CaretRight,
  DownloadSimple,
  UploadSimple,
  Trash,
} from "@phosphor-icons/react";
import type { ResultadoHistorico } from "../tipos";

interface HistoricoProps {
  onVoltar: () => void;
  onAbrirResultado: (resultado: ResultadoHistorico) => boolean;
}

function formatarData(data: string): string {
  const dataResultado = new Date(data);
  if (Number.isNaN(dataResultado.getTime())) return "data desconhecida";
  return dataResultado.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// Histórico: lista todos os resultados, um item por prova feita (cada novo
// simulado entra no topo), com exportar/importar o save (.json).
export default function Historico({
  onVoltar,
  onAbrirResultado,
}: HistoricoProps) {
  const [resultados, setResultados] =
    useState<ResultadoHistorico[]>(listarResultados());
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
        setResultados(listarResultados());
        setMensagem(`${quantidadeImportada} resultado(s) importado(s).`);
      } catch (erro) {
        setMensagem(
          erro instanceof Error && erro.message === "sem espaço"
            ? "sem espaço no navegador para importar esse save."
            : "save inválido.",
        );
      }
    };
    leitor.readAsText(arquivo);
  };

  const limparTodoHistorico = () => {
    limparHistorico();
    setResultados([]);
  };

  const abrirResultado = (resultado: ResultadoHistorico) => {
    const abriu = onAbrirResultado(resultado);
    if (!abriu)
      setMensagem(
        "esse resultado é de um save antigo e não guarda a correção completa.",
      );
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

      {resultados.length === 0 ? (
        <p className="text-muted text-center py-10">
          nenhum resultado ainda. faça uma prova!
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {resultados.map((resultado, indice) => (
            <button
              key={`${resultado.provaId}-${resultado.data}-${indice}`}
              onClick={() => abrirResultado(resultado)}
              title="ver a correção"
              className="rounded-xl bg-cartao border border-linha p-4 flex items-center gap-4 text-left hover:border-primaria transition active:scale-[.99]"
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{resultado.titulo}</div>
                <div className="text-sm text-muted">
                  {formatarData(resultado.data)}
                </div>
                <div className="text-xs text-primaria font-semibold mt-1">
                  ver correção
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-primaria tabular-nums">
                  {resultado.percentual}%
                </div>
                <div className="text-[11px] text-muted uppercase tracking-wider">
                  {resultado.acertos}/{resultado.total} acertos
                </div>
              </div>
              <CaretRight size={16} className="text-muted shrink-0" />
            </button>
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
