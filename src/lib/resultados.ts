// Histórico de resultados (arquivo de save). Fica no localStorage, sem servidor,
// e pode ser exportado/importado como um .json portátil entre computadores.
import type { ResultadoHistorico, ResumoProva } from "../tipos";

const CHAVE_HISTORICO = "simulado_historico";

export function getHistorico(): ResultadoHistorico[] {
  try {
    return JSON.parse(
      localStorage.getItem(CHAVE_HISTORICO) || "[]",
    ) as ResultadoHistorico[];
  } catch {
    return [];
  }
}

function salvarHistorico(historico: ResultadoHistorico[]): void {
  // O histórico é secundário: se a cota estourar, não quebramos a correção.
  try {
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
  } catch {
    console.warn(
      "[simulado] não deu pra salvar o histórico (armazenamento cheio)",
    );
  }
}

export function registrarResultado(
  resultado: Omit<ResultadoHistorico, "data">,
): ResultadoHistorico[] {
  const historico = getHistorico();
  historico.push({ ...resultado, data: new Date().toISOString() });
  salvarHistorico(historico);
  return historico;
}

export function limparHistorico(): void {
  localStorage.removeItem(CHAVE_HISTORICO);
}

// Melhor resultado + nº de tentativas por prova (para a tela de histórico).
export function resumoPorProva(): ResumoProva[] {
  const resumoPorId: Record<string, ResumoProva> = {};
  for (const resultado of getHistorico()) {
    const resumo = (resumoPorId[resultado.provaId] ||= {
      provaId: resultado.provaId,
      titulo: resultado.titulo,
      tentativas: 0,
      melhor: 0,
      ultima: null,
    });
    resumo.tentativas++;
    resumo.melhor = Math.max(resumo.melhor, resultado.percentual);
    if (!resumo.ultima || resultado.data > resumo.ultima)
      resumo.ultima = resultado.data;
  }
  return Object.values(resumoPorId).sort((a, b) =>
    (b.ultima || "").localeCompare(a.ultima || ""),
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
  salvarHistorico([...historicoAtual, ...resultadosNovos]);
  return resultadosNovos.length;
}
