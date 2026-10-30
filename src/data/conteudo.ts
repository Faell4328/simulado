// Conteúdo do simulado. Cada prova é um arquivo JSON autocontido em
// ./provas/*.json — pra ADICIONAR uma prova basta soltar um arquivo lá (o
// import.meta.glob abaixo pega automaticamente, sem manifesto nem código).
// O usuário também pode subir provas do próprio PC (ver lib/provasUsuario.ts).
// O formato está documentado em FORMATO.md.
import type {
  OrigemProva,
  Prova,
  ProvaBruta,
  Questao,
  TipoQuestao,
} from "../tipos";

const arquivosProvas = import.meta.glob<ProvaBruta>("./provas/*.json", {
  eager: true,
  import: "default",
});

// Valida uma prova (não quebra; retorna avisos). Útil pra quem sobe conteúdo.
export function validarProva(prova: ProvaBruta): string[] {
  const avisos: string[] = [];
  if (!prova || typeof prova !== "object")
    return ["arquivo não é um objeto JSON válido"];
  if (!prova.titulo) avisos.push('sem "titulo"');
  if (!Array.isArray(prova.questoes) || prova.questoes.length === 0)
    avisos.push('sem "questoes"');
  (prova.questoes || []).forEach((questao, indice) => {
    if (!questao.enunciado)
      avisos.push(`questão ${indice + 1}: sem "enunciado"`);
    if (questao.tipo === "certo_errado") {
      if (typeof questao.gabarito !== "boolean")
        avisos.push(
          `questão ${indice + 1}: certo/errado precisa de gabarito boolean`,
        );
    } else {
      if (
        !Array.isArray(questao.alternativas) ||
        questao.alternativas.length < 2
      )
        avisos.push(
          `questão ${indice + 1}: múltipla precisa de "alternativas"`,
        );
      if (typeof questao.gabarito !== "number")
        avisos.push(
          `questão ${indice + 1}: múltipla precisa de gabarito (índice)`,
        );
    }
  });
  return avisos;
}

// Normaliza uma prova crua (do glob ou de upload) para o formato interno.
// origem: 'embutida' | 'usuario'. caminhoArquivo: usado como fallback de id.
export function normalizarProva(
  prova: ProvaBruta,
  caminhoArquivo = "",
  origem: OrigemProva = "embutida",
): Prova {
  const idProva =
    prova.id ||
    caminhoArquivo.split("/").pop()?.replace(".json", "") ||
    `prova-${Date.now()}`;
  const titulo = prova.titulo || idProva;
  const banca = prova.banca || "-";
  const questoesBrutas = Array.isArray(prova.questoes) ? prova.questoes : [];
  const questoes: Questao[] = questoesBrutas.map((questao, indice) => {
    const tipo: TipoQuestao =
      questao.tipo === "certo_errado" ? "certo_errado" : "multipla";
    return {
      id: `${idProva}-${indice + 1}`,
      provaId: idProva,
      provaTitulo: titulo,
      tipo,
      materia: questao.materia || "Geral",
      banca: questao.banca || banca,
      ano: questao.ano || prova.ano,
      orgao: questao.orgao || prova.orgao,
      enunciado: questao.enunciado || "",
      alternativas: questao.alternativas,
      gabarito:
        tipo === "certo_errado"
          ? Boolean(questao.gabarito)
          : Number(questao.gabarito ?? 0),
      comentario: questao.comentario,
    };
  });
  return {
    id: idProva,
    titulo,
    banca,
    orgao: prova.orgao || "",
    ano: prova.ano || null,
    tempoMin: prova.tempoMin || 60,
    origem,
    questoes,
  };
}

// Provas que vêm no app (arquivos em ./provas/), mais recentes primeiro.
export const PROVAS_EMBUTIDAS: Prova[] = Object.entries(arquivosProvas)
  .map(([caminhoArquivo, prova]) => {
    const avisos = validarProva(prova);
    if (avisos.length)
      console.warn(`[simulado] ${caminhoArquivo}:`, avisos.join("; "));
    return normalizarProva(prova, caminhoArquivo, "embutida");
  })
  .sort((a, b) => (b.ano || 0) - (a.ano || 0));

// Junta as questões de um conjunto de provas (para a maratona / aleatórias).
export function bancoDeQuestoes(provas: Prova[]): Questao[] {
  return provas.flatMap((prova) => prova.questoes);
}
