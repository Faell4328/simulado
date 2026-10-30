// Correção do simulado: compara respostas com o gabarito e agrega por matéria.
// respostas: { [idQuestao]: valor }  — valor = índice (múltipla) ou boolean (C/E)
import type {
  EstatisticaMateria,
  Questao,
  Respostas,
  ResultadoCorrecao,
  TipoPontuacao,
  ValorResposta,
} from "../tipos";

export function respostaCerta(
  questao: Questao,
  resposta: ValorResposta,
): boolean {
  if (resposta === undefined || resposta === null) return false;
  return resposta === questao.gabarito;
}

// pontuacao: 'bruto' (padrão) conta só acertos; 'cebraspe' desconta cada erro de
// um acerto (nota líquida = acertos − erros, mínimo 0) — como as provas Cebraspe.
export function corrigir(
  questoes: Questao[],
  respostas: Respostas,
  { pontuacao = "bruto" }: { pontuacao?: TipoPontuacao } = {},
): ResultadoCorrecao {
  let acertos = 0;
  let erros = 0;
  const porMateria: Record<string, EstatisticaMateria> = {};
  const detalhe = questoes.map((questao) => {
    const respostaDada = respostas[questao.id];
    const foiRespondida = respostaDada !== undefined && respostaDada !== null;
    const estaCorreta = respostaCerta(questao, respostaDada);
    const estaErrada = foiRespondida && !estaCorreta;
    if (estaCorreta) acertos++;
    if (estaErrada) erros++;
    const estatisticaMateria = (porMateria[questao.materia] ||= {
      total: 0,
      acertos: 0,
      erros: 0,
    });
    estatisticaMateria.total++;
    if (estaCorreta) estatisticaMateria.acertos++;
    if (estaErrada) estatisticaMateria.erros++;
    return { questao, resposta: respostaDada, certa: estaCorreta };
  });
  const totalQuestoes = questoes.length;
  const pontuacaoLiquida =
    pontuacao === "cebraspe" ? Math.max(0, acertos - erros) : acertos;
  return {
    acertos,
    erros,
    liquido: pontuacaoLiquida,
    pontuacao,
    total: totalQuestoes,
    percentual: totalQuestoes
      ? Math.round((pontuacaoLiquida / totalQuestoes) * 100)
      : 0,
    porMateria,
    detalhe,
  };
}
