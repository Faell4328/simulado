import { describe, it, expect } from "vitest";
import { corrigir, respostaCerta } from "./correcao";
import { formatarTempo } from "./tempo";
import type { Questao } from "../tipos";

const questoes: Questao[] = [
  {
    id: "a",
    provaId: "p",
    provaTitulo: "P",
    tipo: "multipla",
    materia: "Português",
    banca: "FCC",
    enunciado: "A",
    gabarito: 2,
  },
  {
    id: "b",
    provaId: "p",
    provaTitulo: "P",
    tipo: "certo_errado",
    materia: "Português",
    banca: "FCC",
    enunciado: "B",
    gabarito: true,
  },
  {
    id: "c",
    provaId: "p",
    provaTitulo: "P",
    tipo: "multipla",
    materia: "Lógica",
    banca: "FCC",
    enunciado: "C",
    gabarito: 0,
  },
];

describe("correcao", () => {
  it("acerta quando a resposta bate com o gabarito", () => {
    expect(respostaCerta(questoes[0], 2)).toBe(true);
    expect(respostaCerta(questoes[1], false)).toBe(false);
    expect(respostaCerta(questoes[2], undefined)).toBe(false);
  });
  it("conta acertos e agrega por matéria", () => {
    const resultado = corrigir(questoes, { a: 2, b: true, c: 4 });
    expect(resultado.acertos).toBe(2);
    expect(resultado.erros).toBe(1);
    expect(resultado.total).toBe(3);
    expect(resultado.percentual).toBe(67);
    expect(resultado.porMateria["Português"]).toEqual({
      total: 2,
      acertos: 2,
      erros: 0,
    });
    expect(resultado.porMateria["Lógica"]).toEqual({
      total: 1,
      acertos: 0,
      erros: 1,
    });
  });
  it("modo cebraspe desconta erro de acerto (líquido, mínimo 0)", () => {
    const resultado = corrigir(
      questoes,
      { a: 2, b: false, c: 4 },
      { pontuacao: "cebraspe" },
    );
    // 1 acerto (a), 2 erros (b, c) → líquido = max(0, 1 - 2) = 0
    expect(resultado.acertos).toBe(1);
    expect(resultado.erros).toBe(2);
    expect(resultado.liquido).toBe(0);
    expect(resultado.percentual).toBe(0);
  });
});

describe("tempo", () => {
  it("formata mm:ss e hh:mm:ss", () => {
    expect(formatarTempo(90)).toBe("01:30");
    expect(formatarTempo(3661)).toBe("01:01:01");
    expect(formatarTempo(-5)).toBe("00:00");
  });
});
