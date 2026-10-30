import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ArrowLeft,
  Timer,
  ListNumbers,
  UploadSimple,
  Trash,
  User,
  MagnifyingGlass,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { baixarProva } from "../lib/baixarArquivo";
import { getProvasUsuario } from "../lib/provasUsuario";
import type { Prova } from "../tipos";

type FiltroValor = string | number;
type Mensagem = { tipo: "erro" | "aviso" | "ok"; texto: string };

interface ListaProvasProps {
  provas: Prova[];
  onSelecionar: (prova: Prova) => void;
  onSubir: (arquivo: File) => Promise<string[]>;
  onRemover: (id: string) => void;
  onVoltar: () => void;
}

interface ChipsProps {
  titulo: string;
  opcoes: FiltroValor[];
  valor: FiltroValor;
  onEscolher: (valor: FiltroValor) => void;
}

// Lista de provas: embutidas + as que o usuário subiu do PC. Busca por texto e
// filtros por banca/órgão/ano, upload de prova (.json) e remover as próprias.
export default function ListaProvas({
  provas,
  onSelecionar,
  onSubir,
  onRemover,
  onVoltar,
}: ListaProvasProps) {
  const bancas: FiltroValor[] = [
    "todas",
    ...new Set(provas.map((prova) => prova.banca).filter(Boolean)),
  ];
  const orgaos: FiltroValor[] = [
    "todos",
    ...new Set(provas.map((prova) => prova.orgao).filter(Boolean)),
  ];
  const anos: FiltroValor[] = [
    "todos",
    ...[
      ...new Set(
        provas
          .map((prova) => prova.ano)
          .filter((ano): ano is number => ano != null),
      ),
    ].sort((a, b) => b - a),
  ];
  const [banca, setBanca] = useState<FiltroValor>("todas");
  const [orgao, setOrgao] = useState<FiltroValor>("todos");
  const [ano, setAno] = useState<FiltroValor>("todos");
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  const termoBusca = busca.trim().toLowerCase();
  const provasFiltradas = provas.filter(
    (prova) =>
      (banca === "todas" || prova.banca === banca) &&
      (orgao === "todos" || prova.orgao === orgao) &&
      (ano === "todos" || prova.ano === ano) &&
      (!termoBusca ||
        `${prova.titulo} ${prova.banca} ${prova.orgao || ""} ${prova.ano || ""}`
          .toLowerCase()
          .includes(termoBusca)),
  );

  const escolherArquivo = async (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite subir o mesmo arquivo de novo
    if (!arquivo) return;
    try {
      const avisos = await onSubir(arquivo);
      setMensagem(
        avisos.length
          ? {
              tipo: "aviso",
              texto: `prova adicionada, mas confira: ${avisos.slice(0, 2).join("; ")}`,
            }
          : { tipo: "ok", texto: "prova adicionada!" },
      );
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto:
          erro instanceof Error ? erro.message : "não deu pra ler o arquivo",
      });
    }
  };

  const encontrarProvaUsuario = (idProva: string): Prova | undefined => {
    const provasUsuario = getProvasUsuario();
    return provasUsuario.find((prova) => prova.id === idProva);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4 animar-entrada">
      <div className="flex items-center gap-3">
        <button
          onClick={onVoltar}
          className="text-muted hover:text-tinta flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={16} /> início
        </button>
        <h1 className="text-lg font-bold">Provas</h1>
        <button
          onClick={() => inputArquivoRef.current?.click()}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primaria text-white text-sm font-semibold hover:bg-primaria-escura transition"
        >
          <UploadSimple size={16} weight="bold" /> subir prova
        </button>
        <input
          ref={inputArquivoRef}
          type="file"
          accept="application/json,.json"
          onChange={escolherArquivo}
          className="hidden"
        />
      </div>

      {mensagem && (
        <div
          className={`text-sm rounded-lg px-3 py-2 ${
            mensagem.tipo === "erro"
              ? "bg-red-50 text-erro"
              : mensagem.tipo === "aviso"
                ? "bg-amber-50 text-amber-700"
                : "bg-green-50 text-acerto"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <label className="flex items-center gap-2 rounded-lg border border-linha px-3 py-2 focus-within:border-primaria transition">
        <MagnifyingGlass size={16} className="text-muted shrink-0" />
        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="buscar por título, banca, órgão ou ano"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      <Chips
        titulo="Banca"
        opcoes={bancas}
        valor={banca}
        onEscolher={setBanca}
      />
      {orgaos.length > 1 && (
        <Chips
          titulo="Órgão"
          opcoes={orgaos}
          valor={orgao}
          onEscolher={setOrgao}
        />
      )}
      {anos.length > 1 && (
        <Chips titulo="Ano" opcoes={anos} valor={ano} onEscolher={setAno} />
      )}

      <div className="flex flex-col gap-3">
        {provasFiltradas.length === 0 && (
          <p className="text-muted text-center py-10">
            nenhuma prova encontrada com esses filtros.
          </p>
        )}
        {provasFiltradas.map((prova) => (
          <div
            key={prova.id}
            className="rounded-xl bg-cartao border border-linha hover:border-primaria cartao-hover flex items-stretch overflow-hidden"
          >
            <button
              onClick={() => onSelecionar(prova)}
              className="flex-1 p-4 text-left"
            >
              <div className="font-bold flex items-center gap-2">
                {prova.titulo}
                {prova.origem === "usuario" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primaria bg-primaria-clara px-2 py-0.5 rounded-full">
                    <User size={11} weight="fill" /> sua
                  </span>
                )}
              </div>
              <div className="text-sm text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>{prova.banca}</span>
                {prova.orgao && <span>{prova.orgao}</span>}
                {prova.ano && <span>{prova.ano}</span>}
                <span className="flex items-center gap-1">
                  <ListNumbers size={15} /> {prova.questoes.length} questões
                </span>
                <span className="flex items-center gap-1">
                  <Timer size={15} /> {prova.tempoMin} min
                </span>
              </div>
            </button>
            {prova.origem === "usuario" && (
              <>
                <button
                  onClick={() => {
                    const provaUsuario = encontrarProvaUsuario(prova.id);
                    if (provaUsuario) baixarProva(provaUsuario);
                    else
                      setMensagem({
                        tipo: "erro",
                        texto: "Erro ao baixar a questão",
                      });
                  }}
                  className="px-3 text-muted hover:text-acerto border-l border-linha"
                  aria-label="baixar prova"
                  title="baixar"
                >
                  <DownloadSimpleIcon size={18} />
                </button>
                <button
                  onClick={() => onRemover(prova.id)}
                  className="px-3 text-muted hover:text-erro border-l border-linha"
                  aria-label="remover prova"
                  title="remover"
                >
                  <Trash size={18} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function Chips({ titulo, opcoes, valor, onEscolher }: ChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted w-12 shrink-0">
        {titulo}
      </span>
      {opcoes.map((opcao) => (
        <button
          key={opcao}
          onClick={() => onEscolher(opcao)}
          className={`px-3 py-1 rounded-full text-sm border transition ${
            valor === opcao
              ? "bg-primaria text-white border-primaria"
              : "border-linha hover:border-primaria"
          }`}
        >
          {opcao}
        </button>
      ))}
    </div>
  );
}
