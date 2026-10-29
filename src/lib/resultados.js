// Histórico de resultados (arquivo de save). Fica no localStorage, sem servidor,
// e pode ser exportado/importado como um .json portátil entre computadores.
const CHAVE_HISTORICO = 'simulado_historico'

export function getHistorico() {
  try { return JSON.parse(localStorage.getItem(CHAVE_HISTORICO) || '[]') } catch { return [] }
}

function salvarHistorico(historico) {
  // O histórico é secundário: se a cota estourar, não quebramos a correção.
  try { localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico)) } catch { console.warn('[simulado] não deu pra salvar o histórico (armazenamento cheio)') }
}

export function registrarResultado({ provaId, titulo, origem, acertos, total, percentual }) {
  const historico = getHistorico()
  historico.push({ provaId, titulo, origem, acertos, total, percentual, data: new Date().toISOString() })
  salvarHistorico(historico)
  return historico
}

export function limparHistorico() {
  localStorage.removeItem(CHAVE_HISTORICO)
}

// Melhor resultado + nº de tentativas por prova (para a tela de histórico).
export function resumoPorProva() {
  const resumoPorId = {}
  for (const resultado of getHistorico()) {
    const resumo = (resumoPorId[resultado.provaId] ||= { provaId: resultado.provaId, titulo: resultado.titulo, tentativas: 0, melhor: 0, ultima: null })
    resumo.tentativas++
    resumo.melhor = Math.max(resumo.melhor, resultado.percentual)
    if (!resumo.ultima || resultado.data > resumo.ultima) resumo.ultima = resultado.data
  }
  return Object.values(resumoPorId).sort((a, b) => (b.ultima || '').localeCompare(a.ultima || ''))
}

// Exporta o save como texto JSON (para baixar num arquivo).
export function exportarSave() {
  return JSON.stringify({ versao: 1, historico: getHistorico() }, null, 2)
}

// Importa um save (mescla com o atual). Retorna quantos registros entraram.
export function importarSave(texto) {
  const dados = JSON.parse(texto)
  const resultadosImportados = Array.isArray(dados) ? dados : dados.historico
  if (!Array.isArray(resultadosImportados)) throw new Error('save inválido')
  const historicoAtual = getHistorico()
  const chavesExistentes = new Set(historicoAtual.map((resultado) => resultado.provaId + resultado.data))
  const resultadosNovos = resultadosImportados.filter((resultado) => resultado && resultado.data && !chavesExistentes.has(resultado.provaId + resultado.data))
  salvarHistorico([...historicoAtual, ...resultadosNovos])
  return resultadosNovos.length
}
