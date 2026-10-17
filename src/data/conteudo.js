// Conteúdo do simulado. Cada prova é um arquivo JSON autocontido em
// ./provas/*.json — pra ADICIONAR uma prova basta soltar um arquivo lá (o
// import.meta.glob abaixo pega automaticamente, sem manifesto nem código).
// O usuário também pode subir provas do próprio PC (ver lib/provasUsuario.js).
// O formato está documentado em FORMATO.md.

const arquivos = import.meta.glob('./provas/*.json', { eager: true, import: 'default' })

// Valida uma prova (não quebra; retorna avisos). Útil pra quem sobe conteúdo.
export function validarProva(prova) {
  const avisos = []
  if (!prova || typeof prova !== 'object') return ['arquivo não é um objeto JSON válido']
  if (!prova.titulo) avisos.push('sem "titulo"')
  if (!Array.isArray(prova.questoes) || prova.questoes.length === 0) avisos.push('sem "questoes"')
  ;(prova.questoes || []).forEach((q, i) => {
    if (!q.enunciado) avisos.push(`questão ${i + 1}: sem "enunciado"`)
    if (q.tipo === 'certo_errado') {
      if (typeof q.gabarito !== 'boolean') avisos.push(`questão ${i + 1}: certo/errado precisa de gabarito boolean`)
    } else {
      if (!Array.isArray(q.alternativas) || q.alternativas.length < 2) avisos.push(`questão ${i + 1}: múltipla precisa de "alternativas"`)
      if (typeof q.gabarito !== 'number') avisos.push(`questão ${i + 1}: múltipla precisa de gabarito (índice)`)
    }
  })
  return avisos
}

// Normaliza uma prova crua (do glob ou de upload) para o formato interno.
// origem: 'embutida' | 'usuario'. chave: nome do arquivo (fallback de id).
export function normalizarProva(prova, chave = '', origem = 'embutida') {
  const idBase = prova.id || chave.split('/').pop().replace('.json', '') || `prova-${Date.now()}`
  const titulo = prova.titulo || idBase
  const banca = prova.banca || '-'
  const questoes = (prova.questoes || []).map((q, i) => ({
    id: `${idBase}-${i + 1}`,
    provaId: idBase,
    provaTitulo: titulo,
    tipo: q.tipo === 'certo_errado' ? 'certo_errado' : 'multipla',
    materia: q.materia || 'Geral',
    banca: q.banca || banca,
    ano: q.ano || prova.ano,
    orgao: q.orgao || prova.orgao,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    gabarito: q.gabarito,
    comentario: q.comentario,
  }))
  return {
    id: idBase,
    titulo,
    banca,
    orgao: prova.orgao || '',
    ano: prova.ano || null,
    tempoMin: prova.tempoMin || 60,
    origem,
    questoes,
  }
}

// Provas que vêm no app (arquivos em ./provas/), mais recentes primeiro.
export const PROVAS_EMBUTIDAS = Object.entries(arquivos)
  .map(([chave, prova]) => {
    const avisos = validarProva(prova)
    if (avisos.length) console.warn(`[simulado] ${chave}:`, avisos.join('; '))
    return normalizarProva(prova, chave, 'embutida')
  })
  .sort((a, b) => (b.ano || 0) - (a.ano || 0))

// Junta as questões de um conjunto de provas (para a maratona / aleatórias).
export function bancoDeQuestoes(provas) {
  return provas.flatMap((p) => p.questoes)
}
