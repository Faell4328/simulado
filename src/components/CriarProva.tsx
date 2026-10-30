import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Questao from "./Questao";
import { copiarTexto } from "../lib/copiar";
import { normalizarProva, validarProva } from "../data/conteudo";
// Fonte única de verdade do formato/prompt: o próprio .md do repositório.
import promptProva from "../../PROMPT-PROVA.md?raw";
import {
  ArrowLeft,
  Plus,
  Trash,
  DownloadSimple,
  FloppyDisk,
  Eye,
  UploadSimple,
  Robot,
  X,
  Copy,
  Check,
} from "@phosphor-icons/react";
import { baixarMd, baixarProva } from "../lib/baixarArquivo";
import type { ProvaBruta, QuestaoBruta, TipoQuestao } from "../tipos";

const TIPOS_QUESTAO: TipoQuestao[] = ["multipla", "certo_errado"];

interface QuestaoEditor {
  tipo: TipoQuestao;
  materia: string;
  enunciado: string;
  alternativas: string[];
  gabarito: number | boolean;
  comentario: string;
}

interface DadosProva {
  titulo: string;
  banca: string;
  orgao: string;
  ano: string | number;
  tempoMin: string | number;
}

interface CriarProvaProps {
  onAdicionar: (prova: ProvaBruta) => void;
  onVoltar: () => void;
}

interface EditorQuestaoProps {
  questao: QuestaoEditor;
  numero: number;
  onChange: (alteracoes: Partial<QuestaoEditor>) => void;
  onRemover: (() => void) | null;
}

interface CampoProps {
  rotulo: string;
  valor: string | number;
  onChange: (valor: string) => void;
  placeholder?: string;
  ocuparDuasColunas?: boolean;
}

function novaQuestao(): QuestaoEditor {
  return {
    tipo: "multipla",
    materia: "",
    enunciado: "",
    alternativas: ["", "", "", ""],
    gabarito: 0,
    comentario: "",
  };
}

function mapearQuestao(questao: QuestaoBruta): QuestaoEditor {
  const ehCertoErrado = questao.tipo === "certo_errado";
  return {
    tipo: ehCertoErrado ? "certo_errado" : "multipla",
    materia: questao.materia || "",
    enunciado: questao.enunciado || "",
    alternativas:
      !ehCertoErrado &&
      Array.isArray(questao.alternativas) &&
      questao.alternativas.length
        ? questao.alternativas
        : ["", "", "", ""],
    gabarito: ehCertoErrado
      ? Boolean(questao.gabarito)
      : typeof questao.gabarito === "number"
        ? questao.gabarito
        : 0,
    comentario: questao.comentario || "",
  };
}

export default function CriarProva({ onAdicionar, onVoltar }: CriarProvaProps) {
  const [dadosProva, setDadosProva] = useState<DadosProva>({
    titulo: "",
    banca: "",
    orgao: "",
    ano: "",
    tempoMin: 60,
  });
  const [questoes, setQuestoes] = useState<QuestaoEditor[]>([novaQuestao()]);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [mostrarAjudaFormato, setMostrarAjudaFormato] = useState(false);
  const inputJsonRef = useRef<HTMLInputElement | null>(null);

  const atualizarQuestao = (
    indice: number,
    alteracoes: Partial<QuestaoEditor>,
  ) =>
    setQuestoes((questoesAtuais) =>
      questoesAtuais.map((questao, posicao) =>
        posicao === indice ? { ...questao, ...alteracoes } : questao,
      ),
    );
  const adicionarQuestao = () =>
    setQuestoes((questoesAtuais) => [...questoesAtuais, novaQuestao()]);
  const removerQuestao = (indice: number) =>
    setQuestoes((questoesAtuais) =>
      questoesAtuais.filter((_, posicao) => posicao !== indice),
    );

  const carregarJson = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        if (typeof leitor.result !== "string")
          throw new Error("arquivo inválido");
        const prova = JSON.parse(leitor.result) as ProvaBruta | QuestaoBruta[];
        const questoesBrutas = Array.isArray(prova)
          ? prova
          : prova.questoes || [];
        if (!Array.isArray(prova)) {
          setDadosProva({
            titulo: prova.titulo || "",
            banca: prova.banca || "",
            orgao: prova.orgao || "",
            ano: prova.ano || "",
            tempoMin: prova.tempoMin || 60,
          });
        }
        const questoesCarregadas = questoesBrutas.map(mapearQuestao);
        setQuestoes(
          questoesCarregadas.length ? questoesCarregadas : [novaQuestao()],
        );
      } catch {
        setMensagem("JSON inválido.");
      }
    };
    leitor.readAsText(arquivo);
  };

  function montarProva(): ProvaBruta {
    const slug = (dadosProva.titulo || "prova")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return {
      id: `${slug || "prova"}-${Date.now().toString(36).slice(-4)}`,
      titulo: dadosProva.titulo,
      banca: dadosProva.banca || undefined,
      orgao: dadosProva.orgao || undefined,
      ano: dadosProva.ano ? Number(dadosProva.ano) : undefined,
      tempoMin: Number(dadosProva.tempoMin) || 60,
      questoes: questoes.map((questao) => {
        const indiceGabarito =
          typeof questao.gabarito === "number" ? questao.gabarito : 0;
        const questaoParaSalvar: QuestaoBruta = {
          materia: questao.materia || undefined,
          tipo: questao.tipo,
          enunciado: questao.enunciado,
        };
        if (questao.comentario)
          questaoParaSalvar.comentario = questao.comentario;
        if (questao.tipo === "certo_errado") {
          questaoParaSalvar.gabarito = Boolean(questao.gabarito);
        } else {
          const textoAlternativaCorreta = (
            questao.alternativas[indiceGabarito] || ""
          ).trim();
          const alternativasPreenchidas = questao.alternativas
            .map((alternativa) => alternativa.trim())
            .filter((alternativa) => alternativa !== "");
          questaoParaSalvar.alternativas = alternativasPreenchidas;
          questaoParaSalvar.gabarito = Math.max(
            0,
            alternativasPreenchidas.indexOf(textoAlternativaCorreta),
          );
        }
        return questaoParaSalvar;
      }),
    };
  }

  const avisos = validarProva(montarProva());

  const adicionar = () => {
    try {
      onAdicionar(montarProva());
      setMensagem("prova adicionada às suas provas!");
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "não deu pra adicionar a prova.",
      );
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-5 animar-entrada">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onVoltar}
          className="text-muted hover:text-tinta flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={16} /> voltar
        </button>
        <h1 className="text-lg font-bold">Criar prova</h1>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setMostrarAjudaFormato(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primaria"
          >
            <Robot size={16} /> formato / prompt p/ IA
          </button>
          <button
            onClick={() => inputJsonRef.current?.click()}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primaria"
          >
            <UploadSimple size={16} /> carregar JSON
          </button>
          <input
            ref={inputJsonRef}
            type="file"
            accept="application/json,.json"
            onChange={carregarJson}
            className="hidden"
          />
          <button
            onClick={() => setMostrarPrevia((valorAtual) => !valorAtual)}
            className="flex items-center gap-1.5 text-sm text-primaria font-semibold"
          >
            <Eye size={16} /> {mostrarPrevia ? "editar" : "prévia"}
          </button>
        </div>
      </div>

      {mostrarPrevia ? (
        <Previa prova={montarProva()} />
      ) : (
        <>
          <section className="rounded-xl bg-cartao border border-linha p-4 grid sm:grid-cols-2 gap-3">
            <Campo
              rotulo="Título"
              valor={dadosProva.titulo}
              onChange={(valor) =>
                setDadosProva({ ...dadosProva, titulo: valor })
              }
              placeholder="Ex.: TJ-SP Escrevente 2023"
              ocuparDuasColunas
            />
            <Campo
              rotulo="Banca"
              valor={dadosProva.banca}
              onChange={(valor) =>
                setDadosProva({ ...dadosProva, banca: valor })
              }
              placeholder="FGV, Cebraspe..."
            />
            <Campo
              rotulo="Órgão"
              valor={dadosProva.orgao}
              onChange={(valor) =>
                setDadosProva({ ...dadosProva, orgao: valor })
              }
              placeholder="TJ-SP, PF..."
            />
            <Campo
              rotulo="Ano"
              valor={dadosProva.ano}
              onChange={(valor) => setDadosProva({ ...dadosProva, ano: valor })}
              placeholder="2023"
            />
            <Campo
              rotulo="Tempo (min)"
              valor={dadosProva.tempoMin}
              onChange={(valor) =>
                setDadosProva({ ...dadosProva, tempoMin: valor })
              }
              placeholder="60"
            />
          </section>

          {questoes.map((questao, indice) => (
            <EditorQuestao
              key={indice}
              questao={questao}
              numero={indice + 1}
              onChange={(alteracoes) => atualizarQuestao(indice, alteracoes)}
              onRemover={
                questoes.length > 1 ? () => removerQuestao(indice) : null
              }
            />
          ))}

          <button
            onClick={adicionarQuestao}
            className="self-start flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-primaria text-primaria font-semibold hover:bg-primaria-clara transition"
          >
            <Plus size={16} weight="bold" /> adicionar questão
          </button>
        </>
      )}

      {avisos.length > 0 && (
        <div className="text-sm rounded-lg bg-amber-50 text-amber-700 px-3 py-2">
          confira antes de salvar: {avisos.slice(0, 3).join("; ")}
        </div>
      )}
      {mensagem && (
        <div className="text-sm rounded-lg bg-green-50 text-acerto px-3 py-2">
          {mensagem}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={adicionar}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primaria text-white font-bold hover:bg-primaria-escura transition"
        >
          <FloppyDisk size={18} weight="fill" /> adicionar às minhas provas
        </button>
        <button
          onClick={() => {
            const prova = montarProva();
            baixarProva(prova);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-linha font-semibold hover:border-primaria transition"
        >
          <DownloadSimple size={18} /> baixar .json
        </button>
      </div>

      {mostrarAjudaFormato && (
        <ModalFormato onFechar={() => setMostrarAjudaFormato(false)} />
      )}
    </main>
  );
}

// Mostra o formato da prova + o "super prompt" pra colar numa LLM junto com a
// prova. O texto vem do PROMPT-PROVA.md, então doc e app nunca divergem.
// Só o miolo entre os marcadores — é isso que vai pra LLM, sem a introdução
// nem as instruções de importar (que só interessam a quem lê o arquivo).
function extrairPrompt(markdown: string): string {
  const inicioPrompt = markdown.indexOf("## INÍCIO DO PROMPT");
  const fimPrompt = markdown.indexOf("## FIM DO PROMPT");
  if (inicioPrompt === -1 || fimPrompt === -1 || fimPrompt < inicioPrompt)
    return markdown;
  return markdown
    .slice(inicioPrompt + "## INÍCIO DO PROMPT".length, fimPrompt)
    .trim();
}

function ModalFormato({ onFechar }: { onFechar: () => void }) {
  const [copiado, setCopiado] = useState(false);

  const copiarPrompt = async () => {
    if (await copiarTexto(extrairPrompt(promptProva))) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4 animar-fade"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-cartao border border-linha flex flex-col overflow-hidden"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-linha">
          <h2 className="font-bold flex items-center gap-2">
            <Robot size={18} weight="fill" /> formato da prova / prompt p/ IA
          </h2>
          <button
            onClick={onFechar}
            className="ml-auto text-muted hover:text-erro"
            aria-label="fechar"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted px-4 pt-3">
          Copie este texto e cole numa IA (ChatGPT, Claude, Gemini){" "}
          <b>junto com a prova</b>, e ela devolve o <code>.json</code> pronto
          pra subir aqui.
        </p>

        <pre className="flex-1 overflow-auto m-4 p-3 rounded-lg bg-fundo border border-linha text-xs leading-relaxed whitespace-pre-wrap font-mono">
          {promptProva}
        </pre>

        <div className="flex flex-wrap gap-3 p-4 border-t border-linha">
          <button
            onClick={copiarPrompt}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primaria text-white font-bold hover:bg-primaria-escura transition"
          >
            {copiado ? (
              <Check size={18} weight="bold" />
            ) : (
              <Copy size={18} weight="fill" />
            )}
            {copiado ? "copiado!" : "copiar prompt"}
          </button>
          <button
            onClick={() => {
              baixarMd("PROMPT-PROVA.md", [promptProva]);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-linha font-semibold hover:border-primaria transition"
          >
            <DownloadSimple size={18} /> baixar .md
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorQuestao({
  questao,
  numero,
  onChange,
  onRemover,
}: EditorQuestaoProps) {
  return (
    <section className="rounded-xl bg-cartao border p-4 flex flex-col gap-3 border-linha">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted flex items-center gap-2">
          questão {numero}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-linha overflow-hidden text-sm">
            {TIPOS_QUESTAO.map((tipo) => (
              <button
                key={tipo}
                onClick={() => onChange({ tipo })}
                className={`px-3 py-1 ${questao.tipo === tipo ? "bg-primaria text-white" : "hover:bg-fundo"}`}
              >
                {tipo === "multipla" ? "múltipla" : "certo/errado"}
              </button>
            ))}
          </div>
          {onRemover && (
            <button
              onClick={onRemover}
              className="text-muted hover:text-erro"
              aria-label="remover questão"
            >
              <Trash size={18} />
            </button>
          )}
        </div>
      </div>

      <input
        value={questao.materia}
        onChange={(evento) => onChange({ materia: evento.target.value })}
        placeholder="matéria (ex.: Português)"
        className="px-3 py-2 rounded-lg border border-linha text-sm"
      />
      <textarea
        value={questao.enunciado}
        onChange={(evento) => onChange({ enunciado: evento.target.value })}
        placeholder="enunciado da questão"
        rows={2}
        className="px-3 py-2 rounded-lg border border-linha"
      />

      {questao.tipo === "certo_errado" ? (
        <div className="flex gap-2">
          {[
            { valor: true, rotulo: "Certo" },
            { valor: false, rotulo: "Errado" },
          ].map(({ valor, rotulo }) => (
            <button
              key={rotulo}
              onClick={() => onChange({ gabarito: valor })}
              className={`flex-1 px-4 py-2 rounded-lg border font-semibold ${questao.gabarito === valor ? "bg-acerto text-white border-acerto" : "border-linha hover:border-primaria"}`}
            >
              {rotulo} {questao.gabarito === valor && "✓"}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted">
            marque o círculo da alternativa correta
          </span>
          {questao.alternativas.map((alternativa, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <button
                onClick={() => onChange({ gabarito: indice })}
                title="correta"
                className={`shrink-0 w-6 h-6 rounded-full border-2 ${questao.gabarito === indice ? "bg-acerto border-acerto" : "border-linha"}`}
              />
              <span className="w-5 text-center text-sm font-bold text-muted">
                {String.fromCharCode(65 + indice)}
              </span>
              <input
                value={alternativa}
                onChange={(evento) =>
                  onChange({
                    alternativas: questao.alternativas.map(
                      (outraAlternativa, outroIndice) =>
                        outroIndice === indice
                          ? evento.target.value
                          : outraAlternativa,
                    ),
                  })
                }
                placeholder={`alternativa ${String.fromCharCode(65 + indice)}`}
                className="flex-1 px-3 py-1.5 rounded-lg border border-linha text-sm"
              />
              {questao.alternativas.length > 2 && (
                <button
                  onClick={() =>
                    onChange({
                      alternativas: questao.alternativas.filter(
                        (_, outroIndice) => outroIndice !== indice,
                      ),
                      gabarito: Math.max(
                        0,
                        (typeof questao.gabarito === "number"
                          ? questao.gabarito
                          : 0) -
                          (indice <=
                          (typeof questao.gabarito === "number"
                            ? questao.gabarito
                            : 0)
                            ? 1
                            : 0),
                      ),
                    })
                  }
                  className="text-muted hover:text-erro"
                  aria-label="remover alternativa"
                >
                  <Trash size={14} />
                </button>
              )}
            </div>
          ))}
          {questao.alternativas.length < 6 && (
            <button
              onClick={() =>
                onChange({ alternativas: [...questao.alternativas, ""] })
              }
              className="self-start text-sm text-primaria font-semibold"
            >
              + alternativa
            </button>
          )}
        </div>
      )}

      <input
        value={questao.comentario}
        onChange={(evento) => onChange({ comentario: evento.target.value })}
        placeholder="comentário/explicação (opcional)"
        className="px-3 py-2 rounded-lg border border-linha text-sm"
      />
    </section>
  );
}

function Previa({ prova }: { prova: ProvaBruta }) {
  const provaNormalizada = normalizarProva(prova, "", "usuario");
  return (
    <section className="flex flex-col gap-4">
      <div className="text-sm text-muted">
        prévia - {provaNormalizada.titulo} · {provaNormalizada.questoes.length}{" "}
        questões
      </div>
      {provaNormalizada.questoes.map((questao, indice) => (
        <div
          key={questao.id}
          className="rounded-xl bg-cartao border border-linha p-4"
        >
          <Questao
            questao={questao}
            numero={indice + 1}
            resposta={questao.gabarito}
            revelar
          />
        </div>
      ))}
    </section>
  );
}

function Campo({
  rotulo,
  valor,
  onChange,
  placeholder,
  ocuparDuasColunas,
}: CampoProps) {
  return (
    <label
      className={`flex flex-col gap-1 ${ocuparDuasColunas ? "sm:col-span-2" : ""}`}
    >
      <span className="text-xs uppercase tracking-wider text-muted">
        {rotulo}
      </span>
      <input
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 rounded-lg border border-linha"
      />
    </label>
  );
}
