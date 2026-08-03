import { describe, it, expect } from 'vitest'
import { corrigir, respostaCerta } from './correcao.js'
import { formatarTempo } from './tempo.js'

const questoes = [
  { id: 'a', tipo: 'multipla', materia: 'Português', gabarito: 2 },
  { id: 'b', tipo: 'certo_errado', materia: 'Português', gabarito: true },
  { id: 'c', tipo: 'multipla', materia: 'Lógica', gabarito: 0 },
]

describe('correcao', () => {
  it('acerta quando a resposta bate com o gabarito', () => {
    expect(respostaCerta(questoes[0], 2)).toBe(true)
    expect(respostaCerta(questoes[1], false)).toBe(false)
    expect(respostaCerta(questoes[2], undefined)).toBe(false)
  })
  it('conta acertos e agrega por matéria', () => {
    const r = corrigir(questoes, { a: 2, b: true, c: 4 })
    expect(r.acertos).toBe(2)
    expect(r.erros).toBe(1)
    expect(r.total).toBe(3)
    expect(r.percentual).toBe(67)
    expect(r.porMateria['Português']).toEqual({ total: 2, acertos: 2, erros: 0 })
    expect(r.porMateria['Lógica']).toEqual({ total: 1, acertos: 0, erros: 1 })
  })
  it('modo cebraspe desconta erro de acerto (líquido, mínimo 0)', () => {
    const r = corrigir(questoes, { a: 2, b: false, c: 4 }, { pontuacao: 'cebraspe' })
    // 1 acerto (a), 2 erros (b, c) → líquido = max(0, 1 - 2) = 0
    expect(r.acertos).toBe(1)
    expect(r.erros).toBe(2)
    expect(r.liquido).toBe(0)
    expect(r.percentual).toBe(0)
  })
})

describe('tempo', () => {
  it('formata mm:ss e hh:mm:ss', () => {
    expect(formatarTempo(90)).toBe('01:30')
    expect(formatarTempo(3661)).toBe('01:01:01')
    expect(formatarTempo(-5)).toBe('00:00')
  })
})
