// Correção do simulado: compara respostas com o gabarito e agrega por matéria.
// respostas: { [idQuestao]: valor }  — valor = índice (múltipla) ou boolean (C/E)

export function respostaCerta(questao, resposta) {
  if (resposta === undefined || resposta === null) return false
  return resposta === questao.gabarito
}

// pontuacao: 'bruto' (padrão) conta só acertos; 'cebraspe' desconta cada erro de
// um acerto (nota líquida = acertos − erros, mínimo 0) — como as provas Cebraspe.
export function corrigir(questoes, respostas, { pontuacao = 'bruto' } = {}) {
  let acertos = 0
  let erros = 0
  const porMateria = {}
  const detalhe = questoes.map((q) => {
    const dada = respostas[q.id]
    const respondida = dada !== undefined && dada !== null
    const certa = respostaCerta(q, dada)
    const errada = respondida && !certa
    if (certa) acertos++
    if (errada) erros++
    const m = (porMateria[q.materia] ||= { total: 0, acertos: 0, erros: 0 })
    m.total++
    if (certa) m.acertos++
    if (errada) m.erros++
    return { questao: q, resposta: dada, certa }
  })
  const total = questoes.length
  const liquido = pontuacao === 'cebraspe' ? Math.max(0, acertos - erros) : acertos
  return {
    acertos,
    erros,
    liquido,
    pontuacao,
    total,
    percentual: total ? Math.round((liquido / total) * 100) : 0,
    porMateria,
    detalhe,
  }
}
