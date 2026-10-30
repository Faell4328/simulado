import { useState } from "react";
import Questao from "./Questao";
import {
  ArrowLeft,
  House,
  ShareNetwork,
  ArrowClockwise,
  Robot,
} from "@phosphor-icons/react";
import { copiarTexto } from "../lib/copiar";
import type {
  Questao as QuestaoModelo,
  ResultadoCorrecao,
  ResultadoQuestao,
  ValorResposta,
} from "../tipos";

type StatusCorrecao = "branco" | "certo" | "errado";

interface ResultadoProps {
  resultado: ResultadoCorrecao;
  subtitulo?: string | null;
  voltandoDoHistorico?: boolean;
  onVoltar: () => void;
  onRefazerErradas: (questoes: QuestaoModelo[]) => void;
}

// Resultado: placar, estatísticas por matéria, refazer as erradas, compartilhar
// e correção completa. O resultado já foi salvo no histórico pelo App.
export default function Resultado({
  resultado,
  subtitulo,
  voltandoDoHistorico = false,
  onVoltar,
  onRefazerErradas,
}: ResultadoProps) {
  const {
    acertos,
    erros,
    liquido,
    pontuacao,
    total,
    percentual,
    porMateria,
    detalhe,
  } = resultado;
  const pontuacaoCebraspe = pontuacao === "cebraspe";
  const notaPrincipal = pontuacaoCebraspe ? liquido : acertos;
  const [copiado, setCopiado] = useState(false);
  const questoesErradas = detalhe
    .filter((resultadoQuestao) => !resultadoQuestao.certa)
    .map((resultadoQuestao) => resultadoQuestao.questao);

  const textoCompartilhado =
    `simulado.tche.studio\n` +
    `${subtitulo ? subtitulo + "\n" : ""}` +
    `Acertei ${notaPrincipal}/${total} (${percentual}%${pontuacaoCebraspe ? " líquido" : ""}).`;

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: textoCompartilhado });
        return;
      } catch (erro) {
        if (erro instanceof Error && erro.name === "AbortError") return;
      }
    }
    if (await copiarTexto(textoCompartilhado)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }
  };

  const descreverAlternativa = (
    questao: QuestaoModelo,
    valorResposta: ValorResposta,
  ): string => {
    if (valorResposta === undefined || valorResposta === null)
      return "em branco";
    if (questao.tipo === "certo_errado")
      return valorResposta ? "Certo" : "Errado";
    const indiceResposta = Number(valorResposta);
    const alternativa = (questao.alternativas || [])[indiceResposta];
    return `${String.fromCharCode(65 + indiceResposta)}) ${alternativa ?? "?"}`;
  };

  const formatarQuestao = (
    resultadoQuestao: ResultadoQuestao,
    indice: number,
  ): string => {
    const { questao, resposta } = resultadoQuestao;
    const linhas = [
      `${indice + 1}. [${questao.materia} · ${questao.banca} - ${questao.ano || ""}]`,
    ];
    linhas.push(questao.enunciado);
    (questao.alternativas || []).forEach((alternativa, indiceAlternativa) =>
      linhas.push(
        `${String.fromCharCode(65 + indiceAlternativa)}) ${alternativa}`,
      ),
    );
    linhas.push(`Resposta marcada: ${descreverAlternativa(questao, resposta)}`);
    linhas.push(`Gabarito: ${descreverAlternativa(questao, questao.gabarito)}`);
    return linhas.join("\n");
  };

  const montarPromptRevisao = async () => {
    const questoesCertas: ResultadoQuestao[] = [];
    const questoesErradasNoPrompt: ResultadoQuestao[] = [];
    for (const resultadoQuestao of detalhe) {
      (resultadoQuestao.certa ? questoesCertas : questoesErradasNoPrompt).push(
        resultadoQuestao,
      );
    }
    const formatarLista = (resultadosQuestoes: ResultadoQuestao[]) =>
      resultadosQuestoes.length
        ? resultadosQuestoes
            .map((resultadoQuestao, indice) =>
              formatarQuestao(resultadoQuestao, indice),
            )
            .join("\n\n")
        : "(nenhuma)";

    const prompt =
      `Atue como meu professor particular na revisão de um simulado que acabei de fazer. ` +
      `Consolide o que eu acertei e me oriente no que errei, explicando o raciocínio de cada questão errada ` +
      `e apontando o que devo reforçar.\n\n` +
      `Resultado: acertei ${notaPrincipal} de ${total} questões.\n\n` +
      `Questões que acertei:\n${formatarLista(questoesCertas)}\n\n` +
      `Questões que errei:\n${formatarLista(questoesErradasNoPrompt)}`;
    if (await copiarTexto(prompt)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6 animar-entrada">
      <div className="text-center flex flex-col items-center gap-1">
        <span className="text-sm uppercase tracking-widest text-muted">
          resultado
        </span>
        <span className="text-5xl font-black text-primaria animar-pop">
          {notaPrincipal}
          <span className="text-2xl text-muted">/{total}</span>
        </span>
        <span className="text-lg font-bold">
          {percentual}% {pontuacaoCebraspe ? "líquido" : "de acerto"}
        </span>
        {pontuacaoCebraspe && (
          <span className="text-sm text-muted">
            {acertos} acertos · {erros} erros (nota líquida Cebraspe)
          </span>
        )}
        {subtitulo && <span className="text-sm text-muted">{subtitulo}</span>}
      </div>

      <section className="rounded-xl bg-cartao border border-linha p-4">
        <div className="text-sm font-semibold text-muted mb-3">
          desempenho por matéria
        </div>
        <div className="flex flex-col gap-2">
          {Object.entries(porMateria).map(([materia, estatisticaMateria]) => {
            const percentualAcerto = Math.round(
              (estatisticaMateria.acertos / estatisticaMateria.total) * 100,
            );
            return (
              <div key={materia}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{materia}</span>
                  <span className="text-muted tabular-nums">
                    {estatisticaMateria.acertos}/{estatisticaMateria.total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-linha overflow-hidden">
                  <div
                    className="h-full bg-primaria"
                    style={{ width: `${percentualAcerto}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="relative flex flex-wrap items-center justify-center gap-3">
        {questoesErradas.length > 0 && (
          <button
            onClick={() => onRefazerErradas(questoesErradas)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tinta text-fundo font-bold hover:opacity-90 transition"
          >
            <ArrowClockwise size={18} weight="bold" /> refazer as{" "}
            {questoesErradas.length} erradas
          </button>
        )}
        <button
          onClick={compartilhar}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primaria text-white font-bold hover:bg-primaria-escura transition"
        >
          <ShareNetwork size={18} weight="fill" /> compartilhar
        </button>
        <button
          onClick={onVoltar}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-linha font-semibold hover:border-primaria transition"
        >
          {voltandoDoHistorico ? (
            <>
              <ArrowLeft size={18} /> histórico
            </>
          ) : (
            <>
              <House size={18} weight="fill" /> início
            </>
          )}
        </button>
        <button
          onClick={montarPromptRevisao}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-acerto border-linha font-semibold hover:border-acerto transition"
        >
          <Robot size={18} weight="fill" /> copiar prompt para revisar com a IA
        </button>
        {copiado && (
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-tinta text-fundo text-xs font-bold px-3 py-1">
            copiado!
          </span>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <div className="text-sm font-semibold text-muted">correção</div>
        {detalhe.map((resultadoQuestao, indice) => {
          const status: StatusCorrecao =
            resultadoQuestao.resposta == null
              ? "branco"
              : resultadoQuestao.certa
                ? "certo"
                : "errado";
          const classeBorda: Record<StatusCorrecao, string> = {
            branco: "border-linha",
            certo: "border-acerto",
            errado: "border-erro",
          };
          const mensagemStatus: Record<
            StatusCorrecao,
            { texto: string; classe: string }
          > = {
            branco: {
              texto: "Você deixou em branco essa questão",
              classe: "bg-white text-black",
            },
            certo: {
              texto: "Você acertou essa questão",
              classe: "bg-green-600 text-white",
            },
            errado: {
              texto: "Você errou essa questão",
              classe: "bg-red-600 text-white",
            },
          };
          return (
            <div
              key={resultadoQuestao.questao.id}
              className={`rounded-xl bg-cartao border p-4 ${classeBorda[status]}`}
            >
              <div className="block mt-1 mb-5">
                <span
                  className={`py-2 px-2 rounded-md ${mensagemStatus[status].classe}`}
                >
                  {mensagemStatus[status].texto}
                </span>
              </div>
              <Questao
                questao={resultadoQuestao.questao}
                numero={indice + 1}
                resposta={resultadoQuestao.resposta}
                revelar
              />
            </div>
          );
        })}
      </section>
    </main>
  );
}
