import { describe, it, expect, beforeEach } from "vitest";
import {
  adicionarDestaque,
  removerDestaque,
  offsetsDaSelecao,
  aplicarDestaques,
  limparMarcas,
} from "./marcaTexto";

function obterPrimeiroNoTexto(elemento: Element): Node {
  const no = elemento.firstChild;
  if (!no) throw new Error("nó de texto não encontrado");
  return no;
}

describe("destaques (dados)", () => {
  it("adiciona, ordena e remove pelo id", () => {
    let lista = adicionarDestaque([], 10, 15, "a");
    lista = adicionarDestaque(lista, 2, 5, "b");
    expect(lista).toEqual([
      { id: "b", inicio: 2, fim: 5 },
      { id: "a", inicio: 10, fim: 15 },
    ]);
    expect(removerDestaque(lista, "a")).toEqual([
      { id: "b", inicio: 2, fim: 5 },
    ]);
  });

  it("funde intervalos sobrepostos e ignora seleção vazia", () => {
    let lista = adicionarDestaque([], 2, 8, "a");
    lista = adicionarDestaque(lista, 6, 12, "b");
    expect(lista).toEqual([{ id: "a", inicio: 2, fim: 12 }]);
    expect(adicionarDestaque(lista, 5, 5)).toBe(lista);
  });
});

describe("marca texto (DOM)", () => {
  let raiz: HTMLDivElement;

  beforeEach(() => {
    raiz = document.createElement("div");
    raiz.innerHTML = "<p>Olá mundo</p><p>Outro texto</p>";
  });

  it("converte a seleção em offsets do texto, sem espaços nas pontas", () => {
    const p1 = obterPrimeiroNoTexto(raiz.children[0]);
    const range = document.createRange();
    range.setStart(p1, 3);
    range.setEnd(p1, 9);
    expect(offsetsDaSelecao(raiz, range)).toEqual({ inicio: 4, fim: 9 });
  });

  it("converte seleção que atravessa parágrafos", () => {
    const p1 = obterPrimeiroNoTexto(raiz.children[0]);
    const p2 = obterPrimeiroNoTexto(raiz.children[1]);
    const range = document.createRange();
    range.setStart(p1, 4);
    range.setEnd(p2, 5);
    expect(offsetsDaSelecao(raiz, range)).toEqual({ inicio: 4, fim: 14 });
  });

  it("envolve os trechos em <mark> e desfaz sem perder o texto", () => {
    aplicarDestaques(raiz, [{ id: "a", inicio: 4, fim: 14 }]);
    const marcas = [...raiz.querySelectorAll('mark[data-marca-texto="a"]')];
    expect(marcas.map((marca) => marca.textContent)).toEqual([
      "mundo",
      "Outro",
    ]);
    expect(raiz.textContent).toBe("Olá mundoOutro texto");

    limparMarcas(raiz);
    expect(raiz.querySelectorAll("mark")).toHaveLength(0);
    expect(raiz.textContent).toBe("Olá mundoOutro texto");
  });

  it("marca vários trechos do mesmo nó sem embaralhar os offsets", () => {
    raiz.innerHTML = "<p>abcdefgh</p>";
    aplicarDestaques(raiz, [
      { id: "dir", inicio: 5, fim: 8 },
      { id: "esq", inicio: 0, fim: 2 },
    ]);
    expect(
      [...raiz.querySelectorAll("mark")].map((marca) => marca.textContent),
    ).toEqual(["ab", "fgh"]);
    expect(raiz.textContent).toBe("abcdefgh");
  });
});
