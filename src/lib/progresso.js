// Progresso de provas em andamento (pausar/retomar). Guardado no localStorage.
// É um mapa { [chave]: estado } — uma prova pausada por sessão (prova+origem),
// então finalizar/pausar uma prova não apaga o progresso de outra.
const CHAVE = 'simulado_progresso'

function chaveSessao(sessao) {
  return `${sessao?.provaId ?? '?'}|${sessao?.origem ?? '?'}`
}

function ler() {
  try {
    const o = JSON.parse(localStorage.getItem(CHAVE) || 'null')
    if (!o || typeof o !== 'object') return {}
    // Migração do formato antigo (um único objeto com .sessao).
    if (o.sessao) return { [chaveSessao(o.sessao)]: o }
    return o
  } catch { return {} }
}

function gravar(todos) {
  try { localStorage.setItem(CHAVE, JSON.stringify(todos)) } catch { /* cota cheia: ignora */ }
}

// estado precisa ter { sessao, respostas, titulo, indice, segundos, ... }.
export function salvarProgresso(estado) {
  if (!estado?.sessao) return
  const todos = ler()
  todos[chaveSessao(estado.sessao)] = { ...estado, salvoEm: Date.now() }
  gravar(todos)
}

// Prova pausada mais recente (para o card "retomar" no início).
export function getProgresso() {
  const arr = Object.values(ler()).filter((p) => p && p.sessao)
  arr.sort((a, b) => (b.salvoEm || 0) - (a.salvoEm || 0))
  return arr[0] || null
}

// Remove o progresso de uma sessão (ao finalizar). Sem argumento, limpa tudo.
export function limparProgresso(sessao) {
  if (!sessao) { localStorage.removeItem(CHAVE); return }
  const todos = ler()
  delete todos[chaveSessao(sessao)]
  gravar(todos)
}
