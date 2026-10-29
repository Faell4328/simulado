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
const transformarUrl = (url) => (url.startsWith('data:image/') ? url : defaultUrlTransform(url))

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
    const elementoRaiz = areaEnunciado.current
    const selecao = window.getSelection()
    if (!elementoRaiz || !selecao || selecao.rangeCount === 0 || selecao.isCollapsed) return
    const intervaloSelecao = selecao.getRangeAt(0)
    if (!elementoRaiz.contains(intervaloSelecao.commonAncestorContainer)) return
    const offsetsSelecao = offsetsDaSelecao(elementoRaiz, intervaloSelecao)
    if (!offsetsSelecao) return
    onMarcarSelecao(offsetsSelecao)
    selecao.removeAllRanges()
  }
  const marcarSelecaoRef = useRef(marcarSelecao)
  useEffect(() => { marcarSelecaoRef.current = marcarSelecao })

  useEffect(() => {
    const elementoRaiz = areaEnunciado.current
    if (!elementoRaiz) return
    limparMarcas(elementoRaiz)
    aplicarDestaques(elementoRaiz, destaques)
  }, [destaques, questao.enunciado])

  useEffect(() => {
    if (!modoMarcacao) return
    marcarSelecaoRef.current()
    const aoMudarSelecao = () => {
      clearTimeout(temporizadorSelecao.current)
      temporizadorSelecao.current = setTimeout(() => marcarSelecaoRef.current(), 350)
    }
    document.addEventListener('selectionchange', aoMudarSelecao)
    return () => {
      clearTimeout(temporizadorSelecao.current)
      document.removeEventListener('selectionchange', aoMudarSelecao)
    }
  }, [modoMarcacao])

  const aoSoltarMouse = (evento) => {
    if (evento.button !== 0) return
    marcarSelecao()
  }
  const aoClicar = (evento) => {
    if (!modoApagar || !onRemoverDestaque) return
    const elementoMarca = evento.target.closest?.('mark[data-marca-texto]')
    if (!elementoMarca) return
    const selecao = window.getSelection()
    if (selecao && !selecao.isCollapsed) return
    onRemoverDestaque(elementoMarca.dataset.marcaTexto)
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
            urlTransform={transformarUrl}
            children={questao.enunciado}
          />
        </div>

      </div>

      {questao.tipo === 'certo_errado' ? (
        <div className="flex gap-3">
          {[{ valor: true, rotulo: 'Certo' }, { valor: false, rotulo: 'Errado' }].map(({ valor, rotulo }) => (
            <Alternativa
              key={rotulo}
              rotulo={rotulo}
              escolhida={resposta === valor}
              estadoVisual={calcularEstadoVisual(revelar, valor === questao.gabarito, resposta === valor)}
              onClick={() => onResponder(valor)}
              revelar={revelar}
              ocuparLargura
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {questao.alternativas.map((alternativa, indice) => (
            <Alternativa
              key={indice}
              letra={String.fromCharCode(65 + indice)}
              texto={alternativa}
              escolhida={resposta === indice}
              riscada={!!riscadas[indice]}
              estadoVisual={calcularEstadoVisual(revelar, indice === questao.gabarito, resposta === indice)}
              onClick={() => onResponder(indice)}
              onRiscar={onRiscar ? () => onRiscar(indice) : null}
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
            urlTransform={transformarUrl}
            children={"**Comentário**: "+questao.comentario}
          />
        </div>
      )}
    </div>
  )
}

function calcularEstadoVisual(revelar, eGabarito, foiEscolhida) {
  if (!revelar) return foiEscolhida ? 'selecionada' : 'normal'
  if (eGabarito) return 'certo'
  if (foiEscolhida) return 'errado'
  return 'normal'
}

function Alternativa({ letra, texto, rotulo, escolhida, riscada, estadoVisual, onClick, onRiscar, revelar, ocuparLargura }) {
  const classeCor = {
    certo: 'border-acerto bg-green-50 text-acerto',
    errado: 'border-erro bg-red-50 text-erro',
    selecionada: 'border-primaria bg-primaria-clara',
    normal: 'border-linha hover:border-primaria bg-cartao',
  }[estadoVisual]

  return (
    <div className={`flex items-center ${ocuparLargura ? 'flex-1' : ''}`}>
      <button
        onClick={onClick}
        disabled={revelar}
        className={`flex-1 flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${revelar ? '' : 'hover:shadow-sm active:scale-[.995]'} ${classeCor} ${riscada ? 'opacity-50 line-through' : ''} ${ocuparLargura ? 'justify-center font-bold' : ''}`}
      >
        {letra && (
          <span className={`shrink-0 grid place-items-center w-7 h-7 rounded-lg border text-sm font-bold ${escolhida || estadoVisual === 'certo' || estadoVisual === 'errado' ? 'border-current' : 'border-linha'}`}>
            {letra}
          </span>
        )}
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw, rehypeMathjax]}
          urlTransform={transformarUrl}
          children={texto || rotulo}
        />
        {estadoVisual === 'certo' && <Check size={18} weight="bold" />}
      </button>
      {onRiscar && !revelar && (
        <button onClick={onRiscar} className="ml-1 p-2 text-muted hover:text-erro" aria-label="riscar alternativa" title="riscar">
          <X size={16} />
        </button>
      )}
    </div>
  )
}
