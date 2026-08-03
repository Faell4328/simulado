// Monta a lista de questões de uma sessão a partir das opções escolhidas na
// tela de configuração (embaralhar, sortear N).

export function embaralharArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Embaralha as alternativas de uma questão múltipla, remapeando o gabarito pro
// novo índice. Certo/errado não tem alternativas — devolve igual.
export function embaralharAlternativas(q) {
  if (q.tipo !== 'multipla' || !Array.isArray(q.alternativas)) return q
  const idx = q.alternativas.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return { ...q, alternativas: idx.map((i) => q.alternativas[i]), gabarito: idx.indexOf(q.gabarito) }
}

export function montarQuestoes(questoes, { embaralhar = false, sortearN = null, embaralharAlt = false } = {}) {
  let qs = questoes
  if (sortearN && sortearN < qs.length) qs = embaralharArray(qs).slice(0, sortearN)
  else if (embaralhar) qs = embaralharArray(qs)
  if (embaralharAlt) qs = qs.map(embaralharAlternativas)
  return qs
}
