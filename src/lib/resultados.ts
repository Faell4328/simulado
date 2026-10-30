// Histórico de resultados (arquivo de save). Fica no localStorage, sem servidor,
// e pode ser exportado/importado como um .json portátil entre computadores.
import { corrigir } from "./correcao";
import type {
  Respostas,
  ResultadoCorrecao,
  ResultadoHistorico,
} from "../tipos";

const CHAVE_HISTORICO = "simulado_historico";

export function getHistorico(): ResultadoHistorico[] {
  try {
    const dados: unknown = JSON.parse(
      localStorage.getItem(CHAVE_HISTORICO) || "[]",
    );
    return Array.isArray(dados) ? (dados as ResultadoHistorico[]) : [];
  } catch {
    return [];
  }
}

function salvarHistorico(historico: ResultadoHistorico[]): boolean {
  // O histórico é secundário: se a cota estourar, não quebramos a correção.
  try {
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
    return true;
  } catch {
    return false;
  }
}

export function registrarResultado(
  resultado: Omit<ResultadoHistorico, "data">,
): ResultadoHistorico[] {
  const historico = getHistorico();
  const registro: ResultadoHistorico = {
    ...resultado,
    data: new Date().toISOString(),
  };
  historico.push(registro);
  if (salvarHistorico(historico)) return historico;

  // Sem espaço: o novo resultado tem prioridade, então abrimos mão dos detalhes
  // das tentativas mais antigas até o save caber. O resumo delas continua.
  let candidato = historico;
  for (let indice = 0; indice < candidato.length - 1; indice++) {
    if (!candidato[indice].detalhe) continue;
    candidato = candidato.map((item, posicao) =>
      posicao === indice ? { ...item, detalhe: undefined } : item,
    );
    if (salvarHistorico(candidato)) return candidato;
  }

  // Última tentativa: salva o novo resultado apenas com o resumo.
  candidato = candidato.map((item, posicao) =>
    posicao === candidato.length - 1 ? { ...item, detalhe: undefined } : item,
  );
  if (salvarHistorico(candidato)) return candidato;

  console.warn(
    "[simulado] não deu pra salvar o histórico (armazenamento cheio)",
  );
  return candidato;
}

export function limparHistorico(): void {
  localStorage.removeItem(CHAVE_HISTORICO);
}

// Todos os resultados registrados, do mais recente para o mais antigo. Cada
// prova feita entra como um item novo na lista.
export function listarResultados(): ResultadoHistorico[] {
  return getHistorico()
    .map((resultado, indice) => ({ resultado, indice }))
    .sort(
      (a, b) =>
        b.resultado.data.localeCompare(a.resultado.data) ||
        // Desempate por ordem de inserção (novos registros vão para o fim).
        b.indice - a.indice,
    )
    .map(({ resultado }) => resultado);
}

// Reconstrói a correção completa a partir de um registro do histórico (para
// reabrir a tela de Resultado). Retorna null em saves antigos sem detalhes.
export function correcaoDoHistorico(
  resultado: ResultadoHistorico,
): ResultadoCorrecao | null {
  if (!Array.isArray(resultado.detalhe) || !resultado.detalhe.length)
    return null;
  const respostas: Respostas = {};
  for (const resultadoQuestao of resultado.detalhe) {
    respostas[resultadoQuestao.questao.id] = resultadoQuestao.resposta;
  }
  return corrigir(
    resultado.detalhe.map((resultadoQuestao) => resultadoQuestao.questao),
    respostas,
    { pontuacao: resultado.pontuacao ?? "bruto" },
  );
}

// Exporta o save como texto JSON (para baixar num arquivo).
export function exportarSave(): string {
  return JSON.stringify({ versao: 1, historico: getHistorico() }, null, 2);
}

// Importa um save (mescla com o atual). Retorna quantos registros entraram.
export function importarSave(texto: string): number {
  const dados: unknown = JSON.parse(texto);
  const resultadosImportados = Array.isArray(dados)
    ? dados
    : typeof dados === "object" && dados !== null && "historico" in dados
      ? (dados as { historico?: unknown }).historico
      : undefined;
  if (!Array.isArray(resultadosImportados)) throw new Error("save inválido");
  const historicoAtual = getHistorico();
  const chavesExistentes = new Set(
    historicoAtual.map((resultado) => resultado.provaId + resultado.data),
  );
  const resultadosNovos = (resultadosImportados as ResultadoHistorico[]).filter(
    (resultado) =>
      resultado &&
      resultado.data &&
      !chavesExistentes.has(resultado.provaId + resultado.data),
  );
  if (!salvarHistorico([...historicoAtual, ...resultadosNovos]))
    throw new Error("sem espaço");
  return resultadosNovos.length;
}
