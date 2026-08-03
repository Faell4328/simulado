import { useRef, useState } from 'react'
import { ClipboardText, Stack, ChartBar, FolderOpen, Play, PencilSimple } from '@phosphor-icons/react'

// Tela inicial: provas, banco de perguntas, histórico, criar/upload e o aviso
// de retomar uma prova pausada.
export default function Inicio({ onProvas, onBanco, onHistorico, onCriar, onSubirPasta, progresso, onRetomar }) {
  const pastaRef = useRef(null)
  const [msg, setMsg] = useState(null)

  const escolherPasta = async (e) => {
    const files = e.target.files
    e.target.value = ''
    if (!files?.length) return
    const r = await onSubirPasta(files)
    setMsg(`${r.adicionadas} prova(s) carregada(s)${r.erros.length ? ` · ${r.erros.length} com erro` : ''}.`)
  }

  return (
    <main className="min-h-screen mx-auto max-w-2xl px-4 py-10 flex flex-col items-center justify-center gap-8 text-center animar-fade">
      {/* desktop mantém o tamanho (scale 3); no mobile a base encolhe (30vw) e reduz proporcional */}
      <img src="/logo.png" alt="simulado" className="logo-simulado w-[min(16rem,30vw)] h-auto scale-[3] origin-center" />

      {progresso && (
        <button
          onClick={onRetomar}
          className="w-full flex items-center gap-3 rounded-xl border border-primaria bg-primaria-clara p-4 text-left cartao-hover active:scale-[.99]"
        >
          <Play size={22} weight="fill" className="text-primaria shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-primaria">retomar prova</div>
            <div className="text-sm text-muted">{progresso.titulo} · questão {progresso.indice + 1}/{progresso.sessao.questoes.length}</div>
          </div>
        </button>
      )}

      <div className="grid sm:grid-cols-3 gap-4 w-full">
        <Cartao Icone={ClipboardText} titulo="Provas" desc="Provas completas, no tempo oficial." onClick={onProvas} />
        <Cartao Icone={Stack} titulo="Banco de perguntas" desc="Questões de todas as provas, filtre e treine." onClick={onBanco} />
        <Cartao Icone={ChartBar} titulo="Histórico" desc="Seus resultados anteriores." onClick={onHistorico} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onCriar}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primaria text-white font-semibold hover:bg-primaria-escura transition"
          >
            <PencilSimple size={18} weight="fill" /> criar prova
          </button>
          <button
            onClick={() => pastaRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg border border-linha font-semibold hover:border-primaria transition"
          >
            <FolderOpen size={18} weight="fill" /> carregar pasta
          </button>
        </div>
        {/* webkitdirectory: seletor de pasta no navegador */}
        <input ref={pastaRef} type="file" webkitdirectory="" directory="" multiple onChange={escolherPasta} className="hidden" />
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </main>
  )
}

function Cartao({ Icone, titulo, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl bg-cartao border border-linha p-5 text-left hover:border-primaria cartao-hover active:scale-[.98] flex flex-col gap-3"
    >
      <span className="grid place-items-center w-11 h-11 rounded-xl bg-primaria-clara text-primaria group-hover:scale-110 transition-transform">
        <Icone size={24} weight="fill" />
      </span>
      <div className="text-base font-bold">{titulo}</div>
      <div className="text-sm text-muted">{desc}</div>
    </button>
  )
}
