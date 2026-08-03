import { useRef, useState } from 'react'
import { resumoPorProva, exportarSave, importarSave, limparHistorico } from '../lib/resultados.js'
import { ArrowLeft, DownloadSimple, UploadSimple, Trash } from '@phosphor-icons/react'

// Histórico: melhor nota e nº de tentativas por prova, com exportar/importar o
// arquivo de save (.json) pra levar entre computadores.
export default function Historico({ onVoltar }) {
  const [resumo, setResumo] = useState(resumoPorProva())
  const [msg, setMsg] = useState(null)
  const inputRef = useRef(null)

  const exportar = () => {
    const blob = new Blob([exportarSave()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'simulado-save.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importar = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const n = importarSave(reader.result)
        setResumo(resumoPorProva())
        setMsg(`${n} resultado(s) importado(s).`)
      } catch { setMsg('save inválido.') }
    }
    reader.readAsText(file)
  }

  const limpar = () => { limparHistorico(); setResumo([]) }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4 animar-entrada">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onVoltar} className="text-muted hover:text-tinta flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> início
        </button>
        <h1 className="text-lg font-bold">Histórico</h1>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-linha text-sm font-semibold hover:border-primaria transition">
            <DownloadSimple size={16} /> exportar
          </button>
          <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-linha text-sm font-semibold hover:border-primaria transition">
            <UploadSimple size={16} /> importar
          </button>
          <input ref={inputRef} type="file" accept="application/json,.json" onChange={importar} className="hidden" />
        </div>
      </div>

      {msg && <div className="text-sm text-muted">{msg}</div>}

      {resumo.length === 0 ? (
        <p className="text-muted text-center py-10">nenhum resultado ainda. faça uma prova!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resumo.map((r) => (
            <div key={r.provaId} className="rounded-xl bg-cartao border border-linha p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{r.titulo}</div>
                <div className="text-sm text-muted">{r.tentativas} tentativa(s) · última {new Date(r.ultima).toLocaleDateString('pt-BR')}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-primaria tabular-nums">{r.melhor}%</div>
                <div className="text-[11px] text-muted uppercase tracking-wider">melhor</div>
              </div>
            </div>
          ))}
          <button onClick={limpar} className="self-center mt-2 flex items-center gap-1.5 text-sm text-erro hover:underline">
            <Trash size={15} /> limpar histórico
          </button>
        </div>
      )}
    </main>
  )
}
