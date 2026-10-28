import { useEffect, useRef } from 'react'
import { Check, X } from '@phosphor-icons/react'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import remarkBreaks from 'remark-breaks'
import { aplicarDestaques, limparMarcas, offsetsDaSelecao } from '../lib/marcaTexto.js'

// O defaultUrlTransform bloqueia o esquema `data:` (usado para imagens inline
// em SVG/base64). Libera apenas data:image; o resto continua sanitizado.
const urlTransform = (url) => (url.startsWith('data:image/') ? url : defaultUrlTransform(url))

const SEM_DESTAQUES = []

// Renderiza uma questão. revelar=true mostra o gabarito (colore certo/errado) e
// bloqueia a interação — usado no modo estudo (após responder) e na correção.
export default function Questao({
  questao, numero, resposta, onResponder, riscadas = {}, onRiscar, revelar,
  destaques = SEM_DESTAQUES, modoMarcacao = false, modoApagar = false, onMarcarSelecao, onRemoverDestaque,
}) {
  const areaEnunciado = useRef(null)
  const temporizadorSelecao = useRef(null)

  const marcarSelecao = () => {
    if (!modoMarcacao || !onMarcarSelecao) return
    const raiz = areaEnunciado.current
    const selecao = window.getSelection()
    if (!raiz || !selecao || selecao.rangeCount === 0 || selecao.isCollapsed) return
    const range = selecao.getRangeAt(0)
    if (!raiz.contains(range.commonAncestorContainer)) return
    const intervalo = offsetsDaSelecao(raiz, range)
    if (!intervalo) return
    onMarcarSelecao(intervalo)
    selecao.removeAllRanges()
  }
  const marcarRef = useRef(marcarSelecao)
  useEffect(() => { marcarRef.current = marcarSelecao })

  useEffect(() => {
    const raiz = areaEnunciado.current
    if (!raiz) return
    limparMarcas(raiz)
    aplicarDestaques(raiz, destaques)
  }, [destaques, questao.enunciado])

  useEffect(() => {
    if (!modoMarcacao) return
    marcarRef.current()
    const aoMudarSelecao = () => {
      clearTimeout(temporizadorSelecao.current)
      temporizadorSelecao.current = setTimeout(() => marcarRef.current(), 350)
    }
    document.addEventListener('selectionchange', aoMudarSelecao)
    return () => {
      clearTimeout(temporizadorSelecao.current)
      document.removeEventListener('selectionchange', aoMudarSelecao)
    }
  }, [modoMarcacao])

  const aoSoltarMouse = (e) => {
    if (e.button !== 0) return
    marcarSelecao()
  }
  const aoClicar = (e) => {
    if (!modoApagar || !onRemoverDestaque) return
    const marca = e.target.closest?.('mark[data-marca-texto]')
    if (!marca) return
    const selecao = window.getSelection()
    if (selecao && !selecao.isCollapsed) return
    onRemoverDestaque(marca.dataset.marcaTexto)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted mb-1 flex flex-wrap gap-x-2">
          <span>questão {numero}</span>
          <span>· {questao.materia}</span>
          {questao.provaTitulo && <span>· {questao.provaTitulo}</span>}
          <span>· {questao.banca}{questao.ano ? ` ${questao.ano}` : ''}</span>
        </div>

        <div
          ref={areaEnunciado}
          className={`prose dark:prose-invert max-w-none${modoMarcacao ? ' marca-texto-ativo' : ''}${modoApagar ? ' marca-texto-apagar' : ''}`}
          onMouseUp={aoSoltarMouse}
          onClick={aoClicar}
        >
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw, rehypeMathjax]}
            urlTransform={urlTransform}
            children={questao.enunciado}
          />
        </div>

      </div>

      {questao.tipo === 'certo_errado' ? (
        <div className="flex gap-3">
          {[{ v: true, l: 'Certo' }, { v: false, l: 'Errado' }].map(({ v, l }) => (
            <Alternativa
              key={l}
              rotulo={l}
              escolhida={resposta === v}
              estado={estadoRevelar(revelar, v === questao.gabarito, resposta === v)}
              onClick={() => onResponder(v)}
              revelar={revelar}
              largo
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {questao.alternativas.map((alt, i) => (
            <Alternativa
              key={i}
              letra={String.fromCharCode(65 + i)}
              texto={alt}
              escolhida={resposta === i}
              riscada={!!riscadas[i]}
              estado={estadoRevelar(revelar, i === questao.gabarito, resposta === i)}
              onClick={() => onResponder(i)}
              onRiscar={onRiscar ? () => onRiscar(i) : null}
              revelar={revelar}
            />
          ))}
        </div>
      )}

      {revelar && questao.comentario && (
        <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg bg-primaria-clara text-tinta text-sm p-3">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw, rehypeMathjax]}
            urlTransform={urlTransform}
            children={"**Comentário**: "+questao.comentario}
          />
        </div>
      )}
    </div>
  )
}

function estadoRevelar(revelar, ehGabarito, escolhida) {
  if (!revelar) return escolhida ? 'sel' : 'normal'
  if (ehGabarito) return 'certo'
  if (escolhida) return 'errado'
  return 'normal'
}

function Alternativa({ letra, texto, rotulo, escolhida, riscada, estado, onClick, onRiscar, revelar, largo }) {
  const cor = {
    certo: 'border-acerto bg-green-50 text-acerto',
    errado: 'border-erro bg-red-50 text-erro',
    sel: 'border-primaria bg-primaria-clara',
    normal: 'border-linha hover:border-primaria bg-cartao',
  }[estado]

  return (
    <div className={`flex items-center ${largo ? 'flex-1' : ''}`}>
      <button
        onClick={onClick}
        disabled={revelar}
        className={`flex-1 flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${revelar ? '' : 'hover:shadow-sm active:scale-[.995]'} ${cor} ${riscada ? 'opacity-50 line-through' : ''} ${largo ? 'justify-center font-bold' : ''}`}
      >
        {letra && (
          <span className={`shrink-0 grid place-items-center w-7 h-7 rounded-lg border text-sm font-bold ${escolhida || estado === 'certo' || estado === 'errado' ? 'border-current' : 'border-linha'}`}>
            {letra}
          </span>
        )}
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw, rehypeMathjax]}
          urlTransform={urlTransform}
          children={texto || rotulo}
        />
        {estado === 'certo' && <Check size={18} weight="bold" />}
      </button>
      {onRiscar && !revelar && (
        <button onClick={onRiscar} className="ml-1 p-2 text-muted hover:text-erro" aria-label="riscar alternativa" title="riscar">
          <X size={16} />
        </button>
      )}
    </div>
  )
}
