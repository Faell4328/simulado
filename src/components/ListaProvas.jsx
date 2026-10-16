import { useRef, useState } from 'react'
import { ArrowLeft, Timer, ListNumbers, UploadSimple, Trash, User, MagnifyingGlass, DownloadSimpleIcon } from '@phosphor-icons/react'
import { baixarProva} from '../lib/baixarArquivo.js'
import { getProvasUsuario } from '../lib/provasUsuario'

// Lista de provas: embutidas + as que o usuário subiu do PC. Busca por texto e
// filtros por banca/órgão/ano, upload de prova (.json) e remover as próprias.
export default function ListaProvas({ provas, onSelecionar, onSubir, onRemover, onVoltar }) {
  const bancas = ['todas', ...new Set(provas.map((p) => p.banca).filter(Boolean))]
  const orgaos = ['todos', ...new Set(provas.map((p) => p.orgao).filter(Boolean))]
  const anos = ['todos', ...[...new Set(provas.map((p) => p.ano).filter(Boolean))].sort((a, b) => b - a)]
  const [banca, setBanca] = useState('todas')
  const [orgao, setOrgao] = useState('todos')
  const [ano, setAno] = useState('todos')
  const [busca, setBusca] = useState('')
  const [msg, setMsg] = useState(null)
  const inputRef = useRef(null)

  const termo = busca.trim().toLowerCase()
  const filtradas = provas.filter((p) =>
    (banca === 'todas' || p.banca === banca) &&
    (orgao === 'todos' || p.orgao === orgao) &&
    (ano === 'todos' || p.ano === ano) &&
    (!termo || `${p.titulo} ${p.banca} ${p.orgao || ''} ${p.ano || ''}`.toLowerCase().includes(termo)),
  )

  const escolherArquivo = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite subir o mesmo arquivo de novo
    if (!file) return
    try {
      const avisos = await onSubir(file)
      setMsg(avisos.length
        ? { tipo: 'aviso', texto: `prova adicionada, mas confira: ${avisos.slice(0, 2).join('; ')}` }
        : { tipo: 'ok', texto: 'prova adicionada!' })
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message || 'não deu pra ler o arquivo' })
    }
  }

  const buscarProva = (idProva) => {
    let provas = getProvasUsuario();
    return provas.find((prova) => {
      return prova.id === idProva;
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4 animar-entrada">
      <div className="flex items-center gap-3">
        <button onClick={onVoltar} className="text-muted hover:text-tinta flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> início
        </button>
        <h1 className="text-lg font-bold">Provas</h1>
        <button
          onClick={() => inputRef.current?.click()}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primaria text-white text-sm font-semibold hover:bg-primaria-escura transition"
        >
          <UploadSimple size={16} weight="bold" /> subir prova
        </button>
        <input ref={inputRef} type="file" accept="application/json,.json" onChange={escolherArquivo} className="hidden" />
      </div>

      {msg && (
        <div className={`text-sm rounded-lg px-3 py-2 ${
          msg.tipo === 'erro' ? 'bg-red-50 text-erro' : msg.tipo === 'aviso' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-acerto'
        }`}>
          {msg.texto}
        </div>
      )}

      <label className="flex items-center gap-2 rounded-lg border border-linha px-3 py-2 focus-within:border-primaria transition">
        <MagnifyingGlass size={16} className="text-muted shrink-0" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="buscar por título, banca, órgão ou ano"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      <Chips titulo="Banca" opcoes={bancas} valor={banca} onEscolher={setBanca} />
      {orgaos.length > 1 && <Chips titulo="Órgão" opcoes={orgaos} valor={orgao} onEscolher={setOrgao} />}
      {anos.length > 1 && <Chips titulo="Ano" opcoes={anos} valor={ano} onEscolher={setAno} />}

      <div className="flex flex-col gap-3">
        {filtradas.length === 0 && (
          <p className="text-muted text-center py-10">nenhuma prova encontrada com esses filtros.</p>
        )}
        {filtradas.map((p) => (
          <div key={p.id} className="rounded-xl bg-cartao border border-linha hover:border-primaria cartao-hover flex items-stretch overflow-hidden">
            <button onClick={() => onSelecionar(p)} className="flex-1 p-4 text-left">
              <div className="font-bold flex items-center gap-2">
                {p.titulo}
                {p.origem === 'usuario' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primaria bg-primaria-clara px-2 py-0.5 rounded-full">
                    <User size={11} weight="fill" /> sua
                  </span>
                )}
              </div>
              <div className="text-sm text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>{p.banca}</span>
                {p.orgao && <span>{p.orgao}</span>}
                {p.ano && <span>{p.ano}</span>}
                <span className="flex items-center gap-1"><ListNumbers size={15} /> {p.questoes.length} questões</span>
                <span className="flex items-center gap-1"><Timer size={15} /> {p.tempoMin} min</span>
              </div>
            </button>
            {p.origem === 'usuario' && (
              <>
                <button
                  onClick={() => { let prova = buscarProva(p.id); prova ? baixarProva(prova) : setMsg({ tipo: "erro", texto: "Erro ao baixar a questão" }); }}
                  className="px-3 text-muted hover:text-acerto border-l border-linha"
                  aria-label="baixar prova" title="baixar"
                >
                  <DownloadSimpleIcon size={18} />
                </button>
                <button
                  onClick={() => onRemover(p.id)}
                  className="px-3 text-muted hover:text-erro border-l border-linha"
                  aria-label="remover prova" title="remover"
                >
                  <Trash size={18} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

function Chips({ titulo, opcoes, valor, onEscolher }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted w-12 shrink-0">{titulo}</span>
      {opcoes.map((o) => (
        <button
          key={o}
          onClick={() => onEscolher(o)}
          className={`px-3 py-1 rounded-full text-sm border transition ${
            valor === o ? 'bg-primaria text-white border-primaria' : 'border-linha hover:border-primaria'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
