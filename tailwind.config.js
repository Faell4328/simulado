/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cores vêm de CSS vars (RGB) definidas no index.css, com override no
        // .dark — assim o modo escuro sai sem mexer em cada componente.
        primaria: {
          DEFAULT: 'rgb(var(--c-primaria) / <alpha-value>)',
          escura: 'rgb(var(--c-primaria-escura) / <alpha-value>)',
          clara: 'rgb(var(--c-primaria-clara) / <alpha-value>)',
        },
        tinta: 'rgb(var(--c-tinta) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        fundo: 'rgb(var(--c-fundo) / <alpha-value>)',
        cartao: 'rgb(var(--c-cartao) / <alpha-value>)',
        linha: 'rgb(var(--c-linha) / <alpha-value>)',
        acerto: 'rgb(var(--c-acerto) / <alpha-value>)',
        erro: 'rgb(var(--c-erro) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
