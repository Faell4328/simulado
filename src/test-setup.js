import '@testing-library/jest-dom'

// O Node 26 expõe um `localStorage` global (undefined sem --localstorage-file) e,
// ao popular o ambiente jsdom, o vitest pula chaves que já existem no global —
// então o localStorage do jsdom nunca chega aos testes. Fornece um Storage em
// memória com a mesma interface, apenas quando o ambiente não traz um de verdade.
if (typeof globalThis.localStorage === 'undefined') {
  const dados = new Map()
  const storage = {
    get length() { return dados.size },
    key: (i) => [...dados.keys()][i] ?? null,
    getItem: (chave) => (dados.has(String(chave)) ? dados.get(String(chave)) : null),
    setItem: (chave, valor) => { dados.set(String(chave), String(valor)) },
    removeItem: (chave) => { dados.delete(String(chave)) },
    clear: () => { dados.clear() },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
}
