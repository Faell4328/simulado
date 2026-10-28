import { useEffect, useRef, useState } from 'react'
import BarraTopo from './BarraTopo.jsx'
import Questao from './Questao.jsx'
import FolhaRespostas from './FolhaRespostas.jsx'
import { formatarTempo } from '../lib/tempo.js'
import { adicionarDestaque, removerDestaque } from '../lib/marcaTexto.js'
import { CaretLeft, CaretRight, CheckCircle, Eraser, Flag, Highlighter, Keyboard, Trash, X } from '@phosphor-icons/react'

const SEM_DESTAQUES = []

// Tela de resolução: questão, navegação, folha, timer, marcar e atalhos.
// modo 'estudo' revela o gabarito assim que responde; 'prova' corrige no fim.
// duracaoSeg = número (regressivo) ou null (progressivo). onPausar salva e sai.
export default function Resolvendo({ questoes, respostas, onResponder, duracaoSeg, modo, subtitulo, onFinalizar, onPausar, onAutosave, inicial }) {
  const [indice, setIndice] = useState(inicial?.indice ?? 0)
  const [riscadas, setRiscadas] = useState(inicial?.riscadas ?? {})
  const [marcadas, setMarcadas] = useState(new Set(inicial?.marcadas ?? []))
  const [reveladas, setReveladas] = useState(new Set(inicial?.reveladas ?? []))
  const [destaques, setDestaques] = useState(inicial?.destaques ?? {})
  const [ferramenta, setFerramenta] = useState(null)
  const [segundos, setSegundos] = useState(inicial?.segundos ?? (duracaoSeg ?? 0))
  const [ajuda, setAjuda] = useState(false)
  const timer = useRef(null)
  // segundos num ref pra o autosave ler o valor atual sem salvar a cada tique.
  const segundosRef = useRef(segundos)
  useEffect(() => { segundosRef.current = segundos }, [segundos])
  // O intervalo é criado uma vez; guardamos o onFinalizar mais recente num ref
  // pra evitar closure velha (senão o tempo acabar corrigia com respostas={}).
  const finalizarRef = useRef(onFinalizar)
  useEffect(() => { finalizarRef.current = onFinalizar }, [onFinalizar])
  // Finalizar manual (botões/Enter): confirma se ainda há questões em branco.
  // O ref garante respostas atuais mesmo dentro do handler de teclado.
  const finalizarManual = () => {
    const faltam = questoes.filter((x) => respostas[x.id] === undefined).length
    if (faltam > 0 && !window.confirm(`Faltam ${faltam} questão(ões) sem responder. Finalizar mesmo assim?`)) return
    onFinalizar()
  }
  const manualRef = useRef(finalizarManual)
  useEffect(() => { manualRef.current = finalizarManual })

  useEffect(() => {
    timer.current = setInterval(() => {
      setSegundos((s) => {
        if (duracaoSeg != null) {
          if (s <= 1) { clearInterval(timer.current); finalizarRef.current(); return 0 }
          return s - 1
        }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const q = questoes[indice]
  const revelarAtual = modo === 'estudo' && reveladas.has(q.id)
  const destaquesQuestao = destaques[q.id] || SEM_DESTAQUES
  const grifando = ferramenta === 'grifar'
  const apagando = ferramenta === 'apagar'
  const alternarFerramenta = (f) => setFerramenta((atual) => (atual === f ? null : f))

  const responder = (id, valor) => {
    if (modo === 'estudo' && reveladas.has(id)) return
    onResponder(id, valor)
    if (modo === 'estudo') setReveladas((s) => new Set(s).add(id))
  }
  const riscar = (alt) => setRiscadas((r) => {
    const q0 = { ...(r[q.id] || {}) }; q0[alt] = !q0[alt]; return { ...r, [q.id]: q0 }
  })
  const marcar = () => setMarcadas((s) => {
    const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n
  })
  const marcarSelecao = ({ inicio, fim }) => setDestaques((d) => ({
    ...d,
    [q.id]: adicionarDestaque(d[q.id] || [], inicio, fim),
  }))
  const removerGrifo = (id) => setDestaques((d) => ({
    ...d,
    [q.id]: removerDestaque(d[q.id] || [], id),
  }))
  const removerTodosGrifos = () => {
    if (!window.confirm('Remover todos os grifos desta questão?')) return
    setDestaques((d) => ({ ...d, [q.id]: [] }))
  }
  const ir = (delta) => setIndice((i) => Math.max(0, Math.min(questoes.length - 1, i + delta)))
  const estadoAtual = (seg = segundos) => ({ indice, segundos: seg, marcadas: [...marcadas], reveladas: [...reveladas], riscadas, destaques })
  const pausar = () => onPausar(estadoAtual())

  // Auto-salva o progresso a cada resposta/navegação/marcação (não a cada
  // segundo). Assim, se a aba fechar no meio, dá pra retomar de onde parou.
  useEffect(() => {
    if (!onAutosave) return
    onAutosave(estadoAtual(segundosRef.current))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, respostas, marcadas, reveladas, riscadas, destaques])

  useEffect(() => {
    if (apagando && destaquesQuestao.length === 0) setFerramenta(null)
  }, [apagando, destaquesQuestao.length])

  // Avisa antes de fechar/recarregar a aba durante a prova (evita perder tudo).
  useEffect(() => {
    const antes = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', antes)
    return () => window.removeEventListener('beforeunload', antes)
  }, [])

  // Atalhos de teclado: A–E / 1–5, C/E, setas, M (marcar), Enter (avançar).
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const k = e.key.toLowerCase()
      if (k === '?') return setAjuda((a) => !a)
      if (k === 'escape') return setAjuda(false)
      if (k === 'arrowleft') return ir(-1)
      if (k === 'arrowright') return ir(1)
      if (k === 'm') return marcar()
      if (k === 'enter') return indice < questoes.length - 1 ? ir(1) : manualRef.current()
      if (q.tipo === 'certo_errado') {
        if (k === 'c') responder(q.id, true)
        if (k === 'e') responder(q.id, false)
      } else {
        const letra = 'abcde'.indexOf(k)
        if (letra >= 0 && letra < q.alternativas.length) return responder(q.id, letra)
        const num = Number(k)
        if (num >= 1 && num <= q.alternativas.length) responder(q.id, num - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, q, modo, reveladas, marcadas])

  const respondidas = questoes.filter((x) => respostas[x.id] !== undefined).length
  const marcada = marcadas.has(q.id)

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
          onClick={() => alternarFerramenta('grifar')}
          onMouseDown={(e) => e.preventDefault()}
          aria-pressed={grifando}
          aria-label="marca texto"
          title="marca texto: ative e selecione o texto que quer grifar"
          className={`grid place-items-center w-9 h-9 rounded-xl transition ${
            grifando ? 'bg-amber-100 text-amber-700' : 'text-muted hover:bg-primaria-clara hover:text-primaria'
          }`}
        >
          <Highlighter size={18} weight={grifando ? 'fill' : 'regular'} />
        </button>
        <div className="h-px w-6 mx-auto bg-linha" />
        <button
          onClick={() => alternarFerramenta('apagar')}
          disabled={destaquesQuestao.length === 0}
          aria-pressed={apagando}
          aria-label="remover grifo"
          title="remover grifo: ative e clique no grifo que quer remover"
          className={`grid place-items-center w-9 h-9 rounded-xl transition disabled:opacity-30 disabled:pointer-events-none ${
            apagando ? 'bg-red-50 text-erro' : 'text-muted hover:bg-red-50 hover:text-erro'
          }`}
        >
          <Eraser size={18} />
        </button>
        <div className="h-px w-6 mx-auto bg-linha" />
        <button
          onClick={removerTodosGrifos}
          disabled={destaquesQuestao.length === 0}
          aria-label="remover tudo"
          title="remover todos os grifos desta questão"
          className="grid place-items-center w-9 h-9 rounded-xl text-muted transition hover:bg-red-50 hover:text-erro disabled:opacity-30 disabled:pointer-events-none"
        >
          <Trash size={18} />
        </button>
      </div>

      <main key={indice} className="mx-auto max-w-2xl pl-16 pr-4 py-6 md:px-4 flex flex-col gap-5 animar-entrada">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted">{respondidas}/{questoes.length} respondidas{modo === 'estudo' ? ' · modo estudo' : ''}</span>
          <button
            onClick={marcar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
              marcada ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-linha text-muted hover:border-amber-300'
            }`}
          >
            <Flag size={15} weight={marcada ? 'fill' : 'regular'} /> {marcada ? 'marcada' : 'marcar'}
          </button>
        </div>

        <Questao
          questao={q}
          numero={indice + 1}
          resposta={respostas[q.id]}
          onResponder={(v) => responder(q.id, v)}
          riscadas={riscadas[q.id] || {}}
          onRiscar={riscar}
          revelar={revelarAtual}
          destaques={destaquesQuestao}
          modoMarcacao={grifando}
          modoApagar={apagando}
          onMarcarSelecao={marcarSelecao}
          onRemoverDestaque={removerGrifo}
        />

        <div className="flex items-center justify-between">
          <button onClick={() => ir(-1)} disabled={indice === 0} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-linha font-semibold disabled:opacity-40 hover:border-primaria transition">
            <CaretLeft size={16} weight="bold" /> anterior
          </button>
          {indice < questoes.length - 1 ? (
            <button onClick={() => ir(1)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-tinta text-fundo font-semibold hover:opacity-90 transition">
              próxima <CaretRight size={16} weight="bold" />
            </button>
          ) : (
            <button onClick={finalizarManual} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primaria text-white font-bold hover:bg-primaria-escura transition">
              <CheckCircle size={18} weight="fill" /> finalizar
            </button>
          )}
        </div>

        <div className="rounded-xl bg-cartao border border-linha p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted">folha de respostas</span>
            <button onClick={() => setAjuda(true)} className="flex items-center gap-1 text-muted hover:text-primaria" title="atalhos (?)">
              <Keyboard size={15} /> atalhos <kbd className="px-1 rounded border border-linha text-[11px]">?</kbd>
            </button>
          </div>
          <FolhaRespostas questoes={questoes} respostas={respostas} marcadas={marcadas} indice={indice} onIr={setIndice} />
          <button onClick={finalizarManual} className="self-start text-sm text-primaria font-semibold hover:underline">
            finalizar e corrigir
          </button>
        </div>
      </main>

      {ajuda && <ModalAtalhos onFechar={() => setAjuda(false)} />}
    </div>
  )
}

function ModalAtalhos({ onFechar }) {
  const atalhos = [
    ['A – E', 'responder múltipla escolha'],
    ['1 – 5', 'responder por número'],
    ['C / E', 'certo / errado'],
    ['← →', 'questão anterior / próxima'],
    ['M', 'marcar questão para revisão'],
    ['Enter', 'avançar (ou finalizar na última)'],
    ['?', 'abrir/fechar esta ajuda'],
    ['Esc', 'fechar esta ajuda'],
  ]
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4 animar-fade" onClick={onFechar}>
      <div className="w-full max-w-sm rounded-2xl bg-cartao border border-linha p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Keyboard size={18} /> atalhos de teclado</h2>
          <button onClick={onFechar} className="text-muted hover:text-erro" aria-label="fechar"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          {atalhos.map(([tecla, desc]) => (
            <div key={tecla} className="flex items-center justify-between text-sm">
              <span className="text-muted">{desc}</span>
              <kbd className="px-2 py-0.5 rounded-md border border-linha bg-fundo font-mono text-xs">{tecla}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
