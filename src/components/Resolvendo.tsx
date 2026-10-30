import { useEffect, useRef, useState } from "react";
import BarraTopo from "./BarraTopo";
import Questao from "./Questao";
import FolhaRespostas from "./FolhaRespostas";
import { formatarTempo } from "../lib/tempo";
import { adicionarDestaque, removerDestaque } from "../lib/marcaTexto";
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  Eraser,
  Flag,
  Highlighter,
  Keyboard,
  Trash,
  X,
} from "@phosphor-icons/react";
import type {
  Destaque,
  DestaquesPorQuestao,
  EstadoInicialResolvendo,
  EstadoResolvendo,
  ModoSessao,
  OffsetsSelecao,
  Questao as QuestaoModelo,
  Respostas,
  Riscadas,
} from "../tipos";

const SEM_DESTAQUES: Destaque[] = [];

type Ferramenta = "grifar" | "apagar" | null;

interface ResolvendoProps {
  questoes: QuestaoModelo[];
  respostas: Respostas;
  onResponder: (idQuestao: string, valor: number | boolean) => void;
  duracaoSeg: number | null;
  modo: ModoSessao;
  subtitulo?: string;
  onFinalizar: () => void;
  onPausar: (estado: EstadoResolvendo) => void;
  onAutosave?: (estado: EstadoResolvendo) => void;
  inicial?: EstadoInicialResolvendo | null;
}

interface ModalAtalhosProps {
  onFechar: () => void;
}

// Tela de resolução: questão, navegação, folha, timer, marcar e atalhos.
// modo 'estudo' revela o gabarito assim que responde; 'prova' corrige no fim.
// duracaoSeg = número (regressivo) ou null (progressivo). onPausar salva e sai.
export default function Resolvendo({
  questoes,
  respostas,
  onResponder,
  duracaoSeg,
  modo,
  subtitulo,
  onFinalizar,
  onPausar,
  onAutosave,
  inicial,
}: ResolvendoProps) {
  const [indice, setIndice] = useState(inicial?.indice ?? 0);
  const [riscadas, setRiscadas] = useState<Riscadas>(inicial?.riscadas ?? {});
  const [marcadas, setMarcadas] = useState<Set<string>>(
    new Set(inicial?.marcadas ?? []),
  );
  const [reveladas, setReveladas] = useState<Set<string>>(
    new Set(inicial?.reveladas ?? []),
  );
  const [destaques, setDestaques] = useState<DestaquesPorQuestao>(
    inicial?.destaques ?? {},
  );
  const [ferramentaAtiva, setFerramentaAtiva] = useState<Ferramenta>(null);
  const [segundos, setSegundos] = useState(
    inicial?.segundos ?? duracaoSeg ?? 0,
  );
  const [ajuda, setAjuda] = useState(false);
  const intervaloTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // segundos num ref pra o autosave ler o valor atual sem salvar a cada tique.
  const segundosRef = useRef(segundos);
  useEffect(() => {
    segundosRef.current = segundos;
  }, [segundos]);
  // O intervalo é criado uma vez; guardamos o onFinalizar mais recente num ref
  // pra evitar closure velha (senão o tempo acabar corrigia com respostas={}).
  const finalizarRef = useRef(onFinalizar);
  useEffect(() => {
    finalizarRef.current = onFinalizar;
  }, [onFinalizar]);
  // Finalizar manual (botões/Enter): confirma se ainda há questões em branco.
  // O ref garante respostas atuais mesmo dentro do handler de teclado.
  const finalizarManual = () => {
    const questoesEmBranco = questoes.filter(
      (questao) => respostas[questao.id] === undefined,
    ).length;
    if (
      questoesEmBranco > 0 &&
      !window.confirm(
        `Faltam ${questoesEmBranco} questão(ões) sem responder. Finalizar mesmo assim?`,
      )
    )
      return;
    onFinalizar();
  };
  const manualRef = useRef(finalizarManual);
  useEffect(() => {
    manualRef.current = finalizarManual;
  });

  useEffect(() => {
    intervaloTimer.current = setInterval(() => {
      setSegundos((segundosAtuais) => {
        if (duracaoSeg != null) {
          if (segundosAtuais <= 1) {
            if (intervaloTimer.current) clearInterval(intervaloTimer.current);
            finalizarRef.current();
            return 0;
          }
          return segundosAtuais - 1;
        }
        return segundosAtuais + 1;
      });
    }, 1000);
    return () => {
      if (intervaloTimer.current) clearInterval(intervaloTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const questaoAtual = questoes[indice];
  const revelarQuestaoAtual =
    modo === "estudo" && reveladas.has(questaoAtual.id);
  const destaquesDaQuestao = destaques[questaoAtual.id] || SEM_DESTAQUES;
  const alternativasQuestaoAtual = questaoAtual.alternativas ?? [];
  const grifando = ferramentaAtiva === "grifar";
  const apagando = ferramentaAtiva === "apagar";
  const alternarFerramenta = (ferramenta: Exclude<Ferramenta, null>) =>
    setFerramentaAtiva((ferramentaAnterior) =>
      ferramentaAnterior === ferramenta ? null : ferramenta,
    );

  const responderQuestao = (idQuestao: string, valor: number | boolean) => {
    if (modo === "estudo" && reveladas.has(idQuestao)) return;
    onResponder(idQuestao, valor);
    if (modo === "estudo")
      setReveladas((reveladasAtuais) =>
        new Set(reveladasAtuais).add(idQuestao),
      );
  };
  const riscar = (alternativa: number) =>
    setRiscadas((riscadasAtuais) => {
      const riscadasDaQuestao = { ...(riscadasAtuais[questaoAtual.id] || {}) };
      riscadasDaQuestao[alternativa] = !riscadasDaQuestao[alternativa];
      return { ...riscadasAtuais, [questaoAtual.id]: riscadasDaQuestao };
    });
  const marcar = () =>
    setMarcadas((marcadasAtuais) => {
      const novasMarcadas = new Set(marcadasAtuais);
      if (novasMarcadas.has(questaoAtual.id))
        novasMarcadas.delete(questaoAtual.id);
      else novasMarcadas.add(questaoAtual.id);
      return novasMarcadas;
    });
  const marcarSelecao = ({ inicio, fim }: OffsetsSelecao) =>
    setDestaques((destaquesAtuais) => ({
      ...destaquesAtuais,
      [questaoAtual.id]: adicionarDestaque(
        destaquesAtuais[questaoAtual.id] || [],
        inicio,
        fim,
      ),
    }));
  const removerGrifo = (id: string) =>
    setDestaques((destaquesAtuais) => ({
      ...destaquesAtuais,
      [questaoAtual.id]: removerDestaque(
        destaquesAtuais[questaoAtual.id] || [],
        id,
      ),
    }));
  const removerTodosGrifos = () => {
    if (!window.confirm("Remover todos os grifos desta questão?")) return;
    setDestaques((destaquesAtuais) => ({
      ...destaquesAtuais,
      [questaoAtual.id]: [],
    }));
  };
  const navegar = (deslocamento: number) =>
    setIndice((indiceAtual) =>
      Math.max(0, Math.min(questoes.length - 1, indiceAtual + deslocamento)),
    );
  const obterEstadoAtual = (segundosAtuais = segundos): EstadoResolvendo => ({
    indice,
    segundos: segundosAtuais,
    marcadas: [...marcadas],
    reveladas: [...reveladas],
    riscadas,
    destaques,
  });
  const pausar = () => onPausar(obterEstadoAtual());

  // Auto-salva o progresso a cada resposta/navegação/marcação (não a cada
  // segundo). Assim, se a aba fechar no meio, dá pra retomar de onde parou.
  useEffect(() => {
    if (!onAutosave) return;
    onAutosave(obterEstadoAtual(segundosRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, respostas, marcadas, reveladas, riscadas, destaques]);

  useEffect(() => {
    if (apagando && destaquesDaQuestao.length === 0) setFerramentaAtiva(null);
  }, [apagando, destaquesDaQuestao.length]);

  // Avisa antes de fechar/recarregar a aba durante a prova (evita perder tudo).
  useEffect(() => {
    const avisarSaida = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      evento.returnValue = "";
    };
    window.addEventListener("beforeunload", avisarSaida);
    return () => window.removeEventListener("beforeunload", avisarSaida);
  }, []);

  // Atalhos de teclado: A–E / 1–5, C/E, setas, M (marcar), Enter (avançar).
  useEffect(() => {
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null;
      if (alvo?.tagName === "INPUT" || alvo?.tagName === "TEXTAREA") return;
      const tecla = evento.key.toLowerCase();
      if (tecla === "?") return setAjuda((ajudaAtual) => !ajudaAtual);
      if (tecla === "escape") return setAjuda(false);
      if (tecla === "arrowleft") return navegar(-1);
      if (tecla === "arrowright") return navegar(1);
      if (tecla === "m") return marcar();
      if (tecla === "enter")
        return indice < questoes.length - 1 ? navegar(1) : manualRef.current();
      if (questaoAtual.tipo === "certo_errado") {
        if (tecla === "c") responderQuestao(questaoAtual.id, true);
        if (tecla === "e") responderQuestao(questaoAtual.id, false);
      } else {
        const indiceLetra = "abcde".indexOf(tecla);
        if (indiceLetra >= 0 && indiceLetra < alternativasQuestaoAtual.length)
          return responderQuestao(questaoAtual.id, indiceLetra);
        const numero = Number(tecla);
        if (numero >= 1 && numero <= alternativasQuestaoAtual.length)
          responderQuestao(questaoAtual.id, numero - 1);
      }
    };
    window.addEventListener("keydown", aoPressionarTecla);
    return () => window.removeEventListener("keydown", aoPressionarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, questaoAtual, modo, reveladas, marcadas]);

  const quantidadeRespondidas = questoes.filter(
    (questao) => respostas[questao.id] !== undefined,
  ).length;
  const questaoMarcada = marcadas.has(questaoAtual.id);

  return (
    <div>
      <BarraTopo
        subtitulo={subtitulo}
        tempo={formatarTempo(segundos)}
        tempoUrgente={duracaoSeg != null && segundos <= 30}
        onSair={pausar}
      />

      <div className="fixed left-2 top-1/2 z-10 -translate-y-1/2 flex flex-col gap-1 rounded-2xl border border-linha bg-cartao p-1.5 shadow-lg animar-pop">
        <button
          onClick={() => alternarFerramenta("grifar")}
          onMouseDown={(evento) => evento.preventDefault()}
          aria-pressed={grifando}
          aria-label="marca texto"
          title="marca texto: ative e selecione o texto que quer grifar"
          className={`grid place-items-center w-9 h-9 rounded-xl transition ${
            grifando
              ? "bg-amber-100 text-amber-700"
              : "text-muted hover:bg-primaria-clara hover:text-primaria"
          }`}
        >
          <Highlighter size={18} weight={grifando ? "fill" : "regular"} />
        </button>
        <div className="h-px w-6 mx-auto bg-linha" />
        <button
          onClick={() => alternarFerramenta("apagar")}
          disabled={destaquesDaQuestao.length === 0}
          aria-pressed={apagando}
          aria-label="remover grifo"
          title="remover grifo: ative e clique no grifo que quer remover"
          className={`grid place-items-center w-9 h-9 rounded-xl transition disabled:opacity-30 disabled:pointer-events-none ${
            apagando
              ? "bg-red-50 text-erro"
              : "text-muted hover:bg-red-50 hover:text-erro"
          }`}
        >
          <Eraser size={18} />
        </button>
        <div className="h-px w-6 mx-auto bg-linha" />
        <button
          onClick={removerTodosGrifos}
          disabled={destaquesDaQuestao.length === 0}
          aria-label="remover tudo"
          title="remover todos os grifos desta questão"
          className="grid place-items-center w-9 h-9 rounded-xl text-muted transition hover:bg-red-50 hover:text-erro disabled:opacity-30 disabled:pointer-events-none"
        >
          <Trash size={18} />
        </button>
      </div>

      <main
        key={indice}
        className="mx-auto max-w-2xl pl-16 pr-4 py-6 md:px-4 flex flex-col gap-5 animar-entrada"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted">
            {quantidadeRespondidas}/{questoes.length} respondidas
            {modo === "estudo" ? " · modo estudo" : ""}
          </span>
          <button
            onClick={marcar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
              questaoMarcada
                ? "bg-amber-100 text-amber-700 border-amber-300"
                : "border-linha text-muted hover:border-amber-300"
            }`}
          >
            <Flag size={15} weight={questaoMarcada ? "fill" : "regular"} />{" "}
            {questaoMarcada ? "marcada" : "marcar"}
          </button>
        </div>

        <Questao
          questao={questaoAtual}
          numero={indice + 1}
          resposta={respostas[questaoAtual.id]}
          onResponder={(valor) => responderQuestao(questaoAtual.id, valor)}
          riscadas={riscadas[questaoAtual.id] || {}}
          onRiscar={riscar}
          revelar={revelarQuestaoAtual}
          destaques={destaquesDaQuestao}
          modoMarcacao={grifando}
          modoApagar={apagando}
          onMarcarSelecao={marcarSelecao}
          onRemoverDestaque={removerGrifo}
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => navegar(-1)}
            disabled={indice === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-linha font-semibold disabled:opacity-40 hover:border-primaria transition"
          >
            <CaretLeft size={16} weight="bold" /> anterior
          </button>
          {indice < questoes.length - 1 ? (
            <button
              onClick={() => navegar(1)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-tinta text-fundo font-semibold hover:opacity-90 transition"
            >
              próxima <CaretRight size={16} weight="bold" />
            </button>
          ) : (
            <button
              onClick={finalizarManual}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primaria text-white font-bold hover:bg-primaria-escura transition"
            >
              <CheckCircle size={18} weight="fill" /> finalizar
            </button>
          )}
        </div>

        <div className="rounded-xl bg-cartao border border-linha p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted">folha de respostas</span>
            <button
              onClick={() => setAjuda(true)}
              className="flex items-center gap-1 text-muted hover:text-primaria"
              title="atalhos (?)"
            >
              <Keyboard size={15} /> atalhos{" "}
              <kbd className="px-1 rounded border border-linha text-[11px]">
                ?
              </kbd>
            </button>
          </div>
          <FolhaRespostas
            questoes={questoes}
            respostas={respostas}
            marcadas={marcadas}
            indice={indice}
            onIr={setIndice}
          />
          <button
            onClick={finalizarManual}
            className="self-start text-sm text-primaria font-semibold hover:underline"
          >
            finalizar e corrigir
          </button>
        </div>
      </main>

      {ajuda && <ModalAtalhos onFechar={() => setAjuda(false)} />}
    </div>
  );
}

function ModalAtalhos({ onFechar }: ModalAtalhosProps) {
  const atalhos: Array<[string, string]> = [
    ["A – E", "responder múltipla escolha"],
    ["1 – 5", "responder por número"],
    ["C / E", "certo / errado"],
    ["← →", "questão anterior / próxima"],
    ["M", "marcar questão para revisão"],
    ["Enter", "avançar (ou finalizar na última)"],
    ["?", "abrir/fechar esta ajuda"],
    ["Esc", "fechar esta ajuda"],
  ];
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4 animar-fade"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-cartao border border-linha p-5 flex flex-col gap-3"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Keyboard size={18} /> atalhos de teclado
          </h2>
          <button
            onClick={onFechar}
            className="text-muted hover:text-erro"
            aria-label="fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {atalhos.map(([tecla, descricao]) => (
            <div
              key={tecla}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted">{descricao}</span>
              <kbd className="px-2 py-0.5 rounded-md border border-linha bg-fundo font-mono text-xs">
                {tecla}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
