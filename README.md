<p align="center">
  <img src=".github/readme-logo.png" alt="simulado" width="520">
</p>

<p align="center">
  App de simulados de prova que roda inteiro no navegador.<br>
  <a href="https://simulado.tche.studio"><strong>simulado.tche.studio</strong></a>
</p>

Junta banco de questões, provas prontas, criação e importação de provas em JSON, folha de respostas, correção, histórico e retomada de prova pausada.

Nada sai da sua máquina. As provas que você sobe e os resultados ficam no seu próprio `localStorage`. Não tem conta, servidor de usuário nem sincronização.

## O que tem

- lista de provas embutidas
- banco de questões, para montar maratonas por filtro
- modo prova com tempo e folha de respostas
- modo estudo
- correção com resumo e comentários
- histórico local de resultados
- criação de prova pelo próprio app
- upload de um `.json` ou de uma pasta inteira de provas
- questões de múltipla escolha e de certo/errado
- imagens, tabelas e fórmulas (Markdown/HTML/LaTeX) nas questões

O formato das provas está documentado em [FORMATO.md](FORMATO.md). O [PROMPT-PROVA.md](PROMPT-PROVA.md) é o mesmo formato embalado como prompt, para pedir provas novas a uma IA.

## Rodando local

Precisa de Node 18 ou mais novo.

```bash
git clone https://github.com/MMD-Marcelo/simulado.git
cd simulado
npm install
npm run dev
```

O Vite sobe em `http://localhost:5173`.

Os outros scripts:

```bash
npm run build      # build de produção em dist/
npm run preview    # serve o build
npm test           # Vitest
```

## Stack

React 18 · Vite 8 · Tailwind CSS 3 · Vitest · Testing Library

## Sobre este repositório

Este é o espelho público do `simulado`. O desenvolvimento acontece no monorepo `tche.studio`, e o deploy de produção em `simulado.tche.studio` também sai de lá pelo Vercel. Aqui é vitrine e ponto de consulta do código.

PRs são bem-vindos como referência, mas qualquer mudança aceita precisa ser portada na mão para o monorepo antes de ir para produção.
