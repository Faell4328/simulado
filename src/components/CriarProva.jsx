import { useRef, useState } from 'react'
import Questao from './Questao.jsx'
import { copiarTexto } from '../lib/copiar.js'
import { normalizarProva, validarProva } from '../data/conteudo.js'
// Fonte única de verdade do formato/prompt: o próprio .md do repositório.
import promptProva from '../../PROMPT-PROVA.md?raw'
import { ArrowLeft, Plus, Trash, DownloadSimple, FloppyDisk, Eye, UploadSimple, Robot, X, Copy, Check } from '@phosphor-icons/react'
import { baixarMd, baixarProva } from '../lib/baixarArquivo.js'

function novaQuestao() {
  return { tipo: 'multipla', materia: '', enunciado: '', alternativas: ['', '', '', ''], gabarito: 0, comentario: '' }
}

function mapearQuestao(q) {
  const ce = q.tipo === 'certo_errado'
  return {
    tipo: ce ? 'certo_errado' : 'multipla',
    materia: q.materia || '',
    enunciado: q.enunciado || '',
    alternativas: !ce && Array.isArray(q.alternativas) && q.alternativas.length ? q.alternativas : ['', '', '', ''],
    gabarito: ce ? !!q.gabarito : (typeof q.gabarito === 'number' ? q.gabarito : 0),
    comentario: q.comentario || '',
  }
}

export default function CriarProva({ onAdicionar, onVoltar }) {
  const [meta, setMeta] = useState({ titulo: '', banca: '', orgao: '', ano: '', tempoMin: 60 })
  const [questoes, setQuestoes] = useState([novaQuestao()])
  const [previa, setPrevia] = useState(false)
  const [msg, setMsg] = useState(null)
  const [ajudaFormato, setAjudaFormato] = useState(false)
  const jsonRef = useRef(null)

  const setQ = (i, patch) => setQuestoes((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  const addQ = () => setQuestoes((qs) => [...qs, novaQuestao()])
  const rmQ = (i) => setQuestoes((qs) => qs.filter((_, j) => j !== i))

  const carregarJSON = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const prova = JSON.parse(reader.result)
        setMeta({ titulo: prova.titulo || '', banca: prova.banca || '', orgao: prova.orgao || '', ano: prova.ano || '', tempoMin: prova.tempoMin || 60 })
        const qs = (Array.isArray(prova) ? prova : prova.questoes || []).map(mapearQuestao)
        setQuestoes(qs.length ? qs : [novaQuestao()])
      } catch { setMsg('JSON inválido.') }
    }
    reader.readAsText(file)
  }

  function montarProva() {
    const slug = (meta.titulo || 'prova').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return {
      id: `${slug || 'prova'}-${Date.now().toString(36).slice(-4)}`,
      titulo: meta.titulo,
      banca: meta.banca || undefined,
      orgao: meta.orgao || undefined,
      ano: meta.ano ? Number(meta.ano) : undefined,
      tempoMin: Number(meta.tempoMin) || 60,
      questoes: questoes.map((q) => {
        const base = { materia: q.materia || undefined, tipo: q.tipo, enunciado: q.enunciado }
        if (q.comentario) base.comentario = q.comentario
        if (q.tipo === 'certo_errado') {
          base.gabarito = !!q.gabarito
        } else {
          const corretaTexto = (q.alternativas[q.gabarito] || '').trim()
          const alts = q.alternativas.map((a) => a.trim()).filter((a) => a !== '')
          base.alternativas = alts
          base.gabarito = Math.max(0, alts.indexOf(corretaTexto))
        }
        return base
      }),
    }
  }

  const avisos = validarProva(montarProva())

  const adicionar = () => {
    try { onAdicionar(montarProva()); setMsg('prova adicionada às suas provas!') }
    catch (e) { setMsg(e.message || 'não deu pra adicionar a prova.') }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-5 animar-entrada">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onVoltar} className="text-muted hover:text-tinta flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> voltar
        </button>
        <h1 className="text-lg font-bold">Criar prova</h1>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => setAjudaFormato(true)} className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primaria">
            <Robot size={16} /> formato / prompt p/ IA
          </button>
          <button onClick={() => jsonRef.current?.click()} className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primaria">
            <UploadSimple size={16} /> carregar JSON
          </button>
          <input ref={jsonRef} type="file" accept="application/json,.json" onChange={carregarJSON} className="hidden" />
          <button onClick={() => setPrevia((p) => !p)} className="flex items-center gap-1.5 text-sm text-primaria font-semibold">
            <Eye size={16} /> {previa ? 'editar' : 'prévia'}
          </button>
        </div>
      </div>

      {previa ? (
        <Previa prova={montarProva()} />
      ) : (
        <>
          <section className="rounded-xl bg-cartao border border-linha p-4 grid sm:grid-cols-2 gap-3">
            <Campo rotulo="Título" valor={meta.titulo} onChange={(v) => setMeta({ ...meta, titulo: v })} placeholder="Ex.: TJ-SP Escrevente 2023" span2 />
            <Campo rotulo="Banca" valor={meta.banca} onChange={(v) => setMeta({ ...meta, banca: v })} placeholder="FGV, Cebraspe..." />
            <Campo rotulo="Órgão" valor={meta.orgao} onChange={(v) => setMeta({ ...meta, orgao: v })} placeholder="TJ-SP, PF..." />
            <Campo rotulo="Ano" valor={meta.ano} onChange={(v) => setMeta({ ...meta, ano: v })} placeholder="2023" />
            <Campo rotulo="Tempo (min)" valor={meta.tempoMin} onChange={(v) => setMeta({ ...meta, tempoMin: v })} placeholder="60" />
          </section>

          {questoes.map((q, i) => (
            <EditorQuestao key={i} q={q} numero={i + 1} onChange={(patch) => setQ(i, patch)} onRemover={questoes.length > 1 ? () => rmQ(i) : null} />
          ))}

          <button onClick={addQ} className="self-start flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-primaria text-primaria font-semibold hover:bg-primaria-clara transition">
            <Plus size={16} weight="bold" /> adicionar questão
          </button>
        </>
      )}

      {avisos.length > 0 && (
        <div className="text-sm rounded-lg bg-amber-50 text-amber-700 px-3 py-2">confira antes de salvar: {avisos.slice(0, 3).join('; ')}</div>
      )}
      {msg && <div className="text-sm rounded-lg bg-green-50 text-acerto px-3 py-2">{msg}</div>}

      <div className="flex flex-wrap gap-3">
        <button onClick={adicionar} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primaria text-white font-bold hover:bg-primaria-escura transition">
          <FloppyDisk size={18} weight="fill" /> adicionar às minhas provas
        </button>
        <button onClick={() => { const prova = montarProva(); baixarProva(prova)}} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-linha font-semibold hover:border-primaria transition">
          <DownloadSimple size={18} /> baixar .json
        </button>
      </div>

      {ajudaFormato && <ModalFormato onFechar={() => setAjudaFormato(false)} />}
    </main>
  )
}

// Mostra o formato da prova + o "super prompt" pra colar numa LLM junto com a
// prova. O texto vem do PROMPT-PROVA.md, então doc e app nunca divergem.
// Só o miolo entre os marcadores — é isso que vai pra LLM, sem a introdução
// nem as instruções de importar (que só interessam a quem lê o arquivo).
function soOPrompt(md) {
  const i = md.indexOf('## INÍCIO DO PROMPT')
  const f = md.indexOf('## FIM DO PROMPT')
  if (i === -1 || f === -1 || f < i) return md
  return md.slice(i + '## INÍCIO DO PROMPT'.length, f).trim()
}

function ModalFormato({ onFechar }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    if (await copiarTexto(soOPrompt(promptProva))) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4 animar-fade" onClick={onFechar}>
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-cartao border border-linha flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-linha">
          <h2 className="font-bold flex items-center gap-2"><Robot size={18} weight="fill" /> formato da prova / prompt p/ IA</h2>
          <button onClick={onFechar} className="ml-auto text-muted hover:text-erro" aria-label="fechar"><X size={18} /></button>
        </div>

        <p className="text-sm text-muted px-4 pt-3">
          Copie este texto e cole numa IA (ChatGPT, Claude, Gemini) <b>junto com a prova</b>,
          e ela devolve o <code>.json</code> pronto pra subir aqui.
        </p>

        <pre className="flex-1 overflow-auto m-4 p-3 rounded-lg bg-fundo border border-linha text-xs leading-relaxed whitespace-pre-wrap font-mono">
          {promptProva}
        </pre>

        <div className="flex flex-wrap gap-3 p-4 border-t border-linha">
          <button onClick={copiar} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primaria text-white font-bold hover:bg-primaria-escura transition">
            {copiado ? <Check size={18} weight="bold" /> : <Copy size={18} weight="fill" />}
            {copiado ? 'copiado!' : 'copiar prompt'}
          </button>
          <button onClick={() => { baixarMd('PROMPT-PROVA.md', [promptProva]); }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-linha font-semibold hover:border-primaria transition">
            <DownloadSimple size={18} /> baixar .md
          </button>
        </div>
      </div>
    </div>
  )
}

function EditorQuestao({ q, numero, onChange, onRemover }) {

  return (
    <section className='rounded-xl bg-cartao border p-4 flex flex-col gap-3 border-linha'>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted flex items-center gap-2">
          questão {numero}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-linha overflow-hidden text-sm">
            {['multipla', 'certo_errado'].map((t) => (
              <button key={t} onClick={() => onChange({ tipo: t })} className={`px-3 py-1 ${q.tipo === t ? 'bg-primaria text-white' : 'hover:bg-fundo'}`}>
                {t === 'multipla' ? 'múltipla' : 'certo/errado'}
              </button>
            ))}
          </div>
          {onRemover && <button onClick={onRemover} className="text-muted hover:text-erro" aria-label="remover questão"><Trash size={18} /></button>}
        </div>
      </div>

      <input value={q.materia} onChange={(e) => onChange({ materia: e.target.value })} placeholder="matéria (ex.: Português)" className="px-3 py-2 rounded-lg border border-linha text-sm" />
      <textarea value={q.enunciado} onChange={(e) => onChange({ enunciado: e.target.value })} placeholder="enunciado da questão" rows={2} className="px-3 py-2 rounded-lg border border-linha" />

      {q.tipo === 'certo_errado' ? (
        <div className="flex gap-2">
          {[{ v: true, l: 'Certo' }, { v: false, l: 'Errado' }].map(({ v, l }) => (
            <button key={l} onClick={() => onChange({ gabarito: v })} className={`flex-1 px-4 py-2 rounded-lg border font-semibold ${q.gabarito === v ? 'bg-acerto text-white border-acerto' : 'border-linha hover:border-primaria'}`}>
              {l} {q.gabarito === v && '✓'}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted">marque o círculo da alternativa correta</span>
          {q.alternativas.map((alt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => onChange({ gabarito: i })} title="correta" className={`shrink-0 w-6 h-6 rounded-full border-2 ${q.gabarito === i ? 'bg-acerto border-acerto' : 'border-linha'}`} />
              <span className="w-5 text-center text-sm font-bold text-muted">{String.fromCharCode(65 + i)}</span>
              <input value={alt} onChange={(e) => onChange({ alternativas: q.alternativas.map((a, j) => (j === i ? e.target.value : a)) })} placeholder={`alternativa ${String.fromCharCode(65 + i)}`} className="flex-1 px-3 py-1.5 rounded-lg border border-linha text-sm" />
              {q.alternativas.length > 2 && (
                <button onClick={() => onChange({ alternativas: q.alternativas.filter((_, j) => j !== i), gabarito: Math.max(0, q.gabarito - (i <= q.gabarito ? 1 : 0)) })} className="text-muted hover:text-erro" aria-label="remover alternativa"><Trash size={14} /></button>
              )}
            </div>
          ))}
          {q.alternativas.length < 6 && (
            <button onClick={() => onChange({ alternativas: [...q.alternativas, ''] })} className="self-start text-sm text-primaria font-semibold">+ alternativa</button>
          )}
        </div>
      )}

      <input value={q.comentario} onChange={(e) => onChange({ comentario: e.target.value })} placeholder="comentário/explicação (opcional)" className="px-3 py-2 rounded-lg border border-linha text-sm" />
    </section>
  )
}

function Previa({ prova }) {
  const norm = normalizarProva(prova, '', 'usuario')
  return (
    <section className="flex flex-col gap-4">
      <div className="text-sm text-muted">prévia - {norm.titulo} · {norm.questoes.length} questões</div>
      {norm.questoes.map((q, i) => (
        <div key={q.id} className="rounded-xl bg-cartao border border-linha p-4">
          <Questao questao={q} numero={i + 1} resposta={q.gabarito} revelar />
        </div>
      ))}
    </section>
  )
}

function Campo({ rotulo, valor, onChange, placeholder, span2 }) {
  return (
    <label className={`flex flex-col gap-1 ${span2 ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs uppercase tracking-wider text-muted">{rotulo}</span>
      <input value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="px-3 py-2 rounded-lg border border-linha" />
    </label>
  )
}
