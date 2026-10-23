import { supabase } from './supabase'

// Aceita "12,50" ou "12.50"; vazio/inválido vira NaN
export function numero(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return NaN
  return Number(String(valor).replace(',', '.'))
}

export function dinheiro(valor) {
  return `R$ ${(Number(valor) || 0).toFixed(2)}`
}

export function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function carregarItensOS(ordemId, empresaId) {
  const { data, error } = await supabase
    .from('os_pecas')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ordem_id', ordemId)
    .order('created_at', { ascending: true })
  if (error) console.error('Erro ao carregar peças da OS:', error)
  return data || []
}

export function somaItens(itens) {
  return itens.reduce((acc, i) => acc + (Number(i.quantidade) || 0) * (Number(i.preco_unitario) || 0), 0)
}

// Traduz os erros do banco (trigger de estoque e RPCs) para mensagens da tela
export async function mensagemErroEstoque(error, pecaId, empresaId) {
  const msg = error?.message || ''
  if (msg.includes('ESTOQUE_INSUFICIENTE')) {
    if (pecaId) {
      const { data } = await supabase.from('pecas').select('nome, quantidade').eq('empresa_id', empresaId).eq('id', pecaId).maybeSingle()
      if (data) return `Estoque insuficiente: há ${Number(data.quantidade) || 0} unidade(s) de ${data.nome}`
    }
    return 'Estoque insuficiente.'
  }
  if (msg.includes('QUANTIDADE_INVALIDA')) return 'Quantidade inválida.'
  if (msg.includes('PECA_NAO_ENCONTRADA')) return 'Peça não encontrada.'
  return 'Erro ao salvar. Tente novamente.'
}
