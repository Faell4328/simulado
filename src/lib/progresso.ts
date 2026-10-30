// Progresso de provas em andamento (pausar/retomar). Guardado no localStorage.
// É um mapa { [chave]: estado } — uma prova pausada por sessão (prova+origem),
// então finalizar/pausar uma prova não apaga o progresso de outra.
import type { ProgressoParaSalvar, ProgressoSalvo, Sessao } from "../tipos";

const CHAVE_PROGRESSO = "simulado_progresso";

type ChaveSessao = Pick<Sessao, "provaId" | "origem">;

function chaveSessao(sessao: ChaveSessao | null | undefined): string {
  return `${sessao?.provaId ?? "?"}|${sessao?.origem ?? "?"}`;
}

function lerProgressoSalvo(): Record<string, ProgressoSalvo> {
  try {
    const dadosSalvos: unknown = JSON.parse(
      localStorage.getItem(CHAVE_PROGRESSO) || "null",
    );
    if (!dadosSalvos || typeof dadosSalvos !== "object") return {};
    // Migração do formato antigo (um único objeto com .sessao).
    if ("sessao" in dadosSalvos) {
      const progresso = dadosSalvos as ProgressoSalvo;
      return { [chaveSessao(progresso.sessao)]: progresso };
    }
    return dadosSalvos as Record<string, ProgressoSalvo>;
  } catch {
    return {};
  }
}

function gravarProgresso(
  progressoPorSessao: Record<string, ProgressoSalvo>,
): void {
  try {
    localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progressoPorSessao));
  } catch {
    /* cota cheia: ignora */
  }
}

// estado precisa ter { sessao, respostas, titulo, indice, segundos, ... }.
export function salvarProgresso(estado: ProgressoParaSalvar): void {
  if (!estado?.sessao) return;
  const progressoPorSessao = lerProgressoSalvo();
  progressoPorSessao[chaveSessao(estado.sessao)] = {
    ...estado,
    salvoEm: Date.now(),
  };
  gravarProgresso(progressoPorSessao);
}

// Prova pausada mais recente (para o card "retomar" no início).
export function getProgresso(): ProgressoSalvo | null {
  const sessoesSalvas = Object.values(lerProgressoSalvo()).filter(
    (progresso) => progresso?.sessao,
  );
  sessoesSalvas.sort((a, b) => (b.salvoEm || 0) - (a.salvoEm || 0));
  return sessoesSalvas[0] ?? null;
}

// Remove o progresso de uma sessão (ao finalizar). Sem argumento, limpa tudo.
export function limparProgresso(sessao?: ChaveSessao | null): void {
  if (!sessao) {
    localStorage.removeItem(CHAVE_PROGRESSO);
    return;
  }
  const progressoPorSessao = lerProgressoSalvo();
  delete progressoPorSessao[chaveSessao(sessao)];
  gravarProgresso(progressoPorSessao);
}
