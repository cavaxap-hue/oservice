import { useState, useEffect } from 'react'

// ============================================================
// SUPRADESK — Tema central (claro / escuro)
// Mude as cores aqui e elas se aplicam no sistema inteiro.
// ============================================================

export const temas = {
  dark: {
    nome: 'dark',
    bg: '#0e1a17',           // fundo geral da página
    sidebar: '#0a1512',      // fundo da barra lateral
    card: '#11211c',         // fundo dos cards e tabelas
    cardBorda: 'rgba(255,255,255,0.06)',
    borda: 'rgba(255,255,255,0.10)',
    texto: '#ffffff',        // texto principal
    textoSuave: '#cdd6d3',   // texto secundário
    textoFraco: '#7e8e89',   // labels, placeholders
    azul: '#378ADD',         // cor de destaque (botões, ativo)
    azulEscuro: '#185FA5',
    inputBg: '#0e1a17',
    inputBorda: 'rgba(255,255,255,0.12)',
    hoverMenu: '#11211c',
    ativoMenu: '#11211c',
  },
  light: {
    nome: 'light',
    bg: '#F4F6F9',
    sidebar: '#ffffff',
    card: '#ffffff',
    cardBorda: '#E6E8EC',
    borda: '#E0E0E0',
    texto: '#1a1a1a',
    textoSuave: '#444',
    textoFraco: '#999',
    azul: '#185FA5',
    azulEscuro: '#0C447C',
    inputBg: '#ffffff',
    inputBorda: '#DDD',
    hoverMenu: '#F4F6F9',
    ativoMenu: '#EEF4FB',
  }
}

// Cores fixas de status (funcionam nos dois temas)
export const cores = {
  aguardando: '#E6A817',
  reparo: '#378ADD',
  pronto: '#1D9E75',
  entregue: '#7B8A86',
  perigo: '#E24B4A',
  sucesso: '#1D9E75',
}

// ============================================================
// FLUXO DE STATUS DAS ORDENS DE SERVIÇO
// Ordem real do trabalho da assistência.
// Mude aqui e reflete no sistema inteiro.
// ============================================================
export const STATUS = {
  'Recebido':            { ordem: 1, cor: '#9BB5D4', icone: '📥', proximo: 'Orçamento' },
  'Orçamento':           { ordem: 2, cor: '#7C5CD6', icone: '🧾', proximo: 'Aguardando aprovação' },
  'Aguardando aprovação':{ ordem: 3, cor: '#E6A817', icone: '⏳', proximo: 'Em reparo' },
  'Em reparo':           { ordem: 4, cor: '#378ADD', icone: '🔧', proximo: 'Pronto' },
  'Pronto':              { ordem: 5, cor: '#1D9E75', icone: '✅', proximo: 'Entregue' },
  'Entregue':            { ordem: 6, cor: '#7B8A86', icone: '📦', proximo: null },
  'Não aprovado':        { ordem: 7, cor: '#E24B4A', icone: '🚫', proximo: null },
}

// Status considerados "em aberto" (equipamento ainda na empresa)
export const STATUS_ABERTOS = ['Recebido', 'Orçamento', 'Aguardando aprovação', 'Em reparo', 'Pronto']

// Status que encerram a OS
export const STATUS_FINAIS = ['Entregue', 'Não aprovado']

// Status inicial de toda OS nova
export const STATUS_INICIAL = 'Recebido'

// Hook que controla o tema e lembra a escolha do usuário
export function useTema() {
  const [modo, setModo] = useState('dark')

  useEffect(() => {
    try {
      const salvo = localStorage.getItem('supradesk-tema')
      if (salvo === 'light' || salvo === 'dark') setModo(salvo)
    } catch (e) { /* ignora se não tiver localStorage */ }
  }, [])

  function alternar() {
    setModo(prev => {
      const novo = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('supradesk-tema', novo) } catch (e) {}
      return novo
    })
  }

  return { t: temas[modo], modo, alternar }
}
