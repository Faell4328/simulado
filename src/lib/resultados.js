// Histórico de resultados (arquivo de save). Fica no localStorage, sem servidor,
// e pode ser exportado/importado como um .json portátil entre computadores.
const CHAVE = 'simulado_historico'

export function getHistorico() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || '[]') } catch { return [] }
}

function salvar(lista) {
  // O histórico é secundário: se a cota estourar, não quebramos a correção.
  try { localStorage.setItem(CHAVE, JSON.stringify(lista)) } catch { console.warn('[simulado] não deu pra salvar o histórico (armazenamento cheio)') }
}

export function registrarResultado({ provaId, titulo, origem, acertos, total, percentual }) {
  const lista = getHistorico()
  lista.push({ provaId, titulo, origem, acertos, total, percentual, data: new Date().toISOString() })
  salvar(lista)
  return lista
}

export function limparHistorico() {
  localStorage.removeItem(CHAVE)
}

// Melhor resultado + nº de tentativas por prova (para a tela de histórico).
export function resumoPorProva() {
  const mapa = {}
  for (const r of getHistorico()) {
    const m = (mapa[r.provaId] ||= { provaId: r.provaId, titulo: r.titulo, tentativas: 0, melhor: 0, ultima: null })
    m.tentativas++
    m.melhor = Math.max(m.melhor, r.percentual)
    if (!m.ultima || r.data > m.ultima) m.ultima = r.data
  }
  return Object.values(mapa).sort((a, b) => (b.ultima || '').localeCompare(a.ultima || ''))
}

// Exporta o save como texto JSON (para baixar num arquivo).
export function exportarSave() {
  return JSON.stringify({ versao: 1, historico: getHistorico() }, null, 2)
}

// Importa um save (mescla com o atual). Retorna quantos registros entraram.
export function importarSave(texto) {
  const dados = JSON.parse(texto)
  const novos = Array.isArray(dados) ? dados : dados.historico
  if (!Array.isArray(novos)) throw new Error('save inválido')
  const atual = getHistorico()
  const chaves = new Set(atual.map((r) => r.provaId + r.data))
  const add = novos.filter((r) => r && r.data && !chaves.has(r.provaId + r.data))
  salvar([...atual, ...add])
  return add.length
}
