import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Clientes from './Clientes'
import Configuracoes from './Configuracoes'
import LayoutsClientes from './LayoutsClientes'
import Logo from './Logo'
import { cores, STATUS, STATUS_ABERTOS, STATUS_FINAIS, STATUS_INICIAL } from './theme'

function Dashboard({ onSair, t, modo, alternar, sessao }) {
  const [tela, setTela] = useState('dashboard')
  const [ordens, setOrdens] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [osEditando, setOsEditando] = useState(null)
  const [form, setForm] = useState({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor_pecas: '', valor_servico: '', hora_inicio: '', hora_fim: '' })
  const [listaClientes, setListaClientes] = useState([])
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false)
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', email: '', cpf: '', endereco: '' })
  const [relInicio, setRelInicio] = useState('')
  const [relFim, setRelFim] = useState('')
  const [relStatus, setRelStatus] = useState('')
  const [hoverCard, setHoverCard] = useState(null)
  const [menuMobileAberto, setMenuMobileAberto] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [osExpandida, setOsExpandida] = useState(null)
  const [modalAnotacoes, setModalAnotacoes] = useState(false)
  const [clienteAnotacao, setClienteAnotacao] = useState(null)
  const [anotacoes, setAnotacoes] = useState([])
  const [novaAnotacao, setNovaAnotacao] = useState({ titulo: '', conteudo: '' })
  const [anotacaoExpandida, setAnotacaoExpandida] = useState(null)

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 768) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    carregarOrdens()
    carregarClientes()
  }, [])

  async function carregarClientes() {
    const { data } = await supabase.from('clientes').select('*').order('nome', { ascending: true })
    if (data) setListaClientes(data)
  }

  function selecionarCliente(nome) {
    if (nome === '__novo__') {
      setMostrarNovoCliente(true)
      return
    }
    const c = listaClientes.find(x => x.nome === nome)
    setForm({ ...form, cliente: nome, telefone: c ? (c.telefone || '') : form.telefone })
  }

  async function carregarAnotacoes(clienteId) {
    const { data } = await supabase.from('anotacoes').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false })
    if (data) setAnotacoes(data)
  }

  async function salvarAnotacao() {
    if (!novaAnotacao.titulo.trim()) return
    await supabase.from('anotacoes').insert([{ ...novaAnotacao, cliente_id: clienteAnotacao.id }])
    setNovaAnotacao({ titulo: '', conteudo: '' })
    carregarAnotacoes(clienteAnotacao.id)
  }

  async function excluirAnotacao(id) {
    if (window.confirm('Excluir esta anotação?')) {
      await supabase.from('anotacoes').delete().eq('id', id)
      carregarAnotacoes(clienteAnotacao.id)
    }
  }

  function abrirModalAnotacoes(cliente) {
    setClienteAnotacao(cliente)
    setModalAnotacoes(true)
    setNovaAnotacao({ titulo: '', conteudo: '' })
    setAnotacaoExpandida(null)
    carregarAnotacoes(cliente.id)
  }

  function calcularDuracao(inicio, fim) {
    if (!inicio || !fim) return null
    const [hi, mi] = inicio.split(':').map(Number)
    const [hf, mf] = fim.split(':').map(Number)
    const totalMin = (hf * 60 + mf) - (hi * 60 + mi)
    if (totalMin <= 0) return null
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}`.trim() : `${m}min`
  }

  async function salvarNovoClienteInline() {
    if (!novoCliente.nome.trim()) { window.alert('Digite ao menos o nome do cliente.'); return }
    const { data } = await supabase.from('clientes').insert([novoCliente]).select()
    await carregarClientes()
    setForm({ ...form, cliente: novoCliente.nome, telefone: novoCliente.telefone || '' })
    setNovoCliente({ nome: '', telefone: '', email: '', cpf: '', endereco: '' })
    setMostrarNovoCliente(false)
  }

  async function abrirNovaOS() {
    await carregarClientes()
    setOsEditando(null)
    setMostrarNovoCliente(false)
    setForm({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor: '' })
    setTela('nova')
  }

  async function carregarOrdens() {
    const { data } = await supabase.from('ordens').select('*').order('numero', { ascending: false })
    if (data) setOrdens(data)
  }

  async function proximoNumero() {
    const { data } = await supabase.from('ordens').select('numero').order('numero', { ascending: false }).limit(1)
    return data && data.length > 0 ? (data[0].numero || 0) + 1 : 1
  }

  async function salvarOS() {
    const numero = await proximoNumero()
    const duracao = calcularDuracao(form.hora_inicio, form.hora_fim)
    const valor_pecas = form.valor_pecas ? parseFloat(form.valor_pecas) : 0
    const valor_servico = form.valor_servico ? parseFloat(form.valor_servico) : 0
    await supabase.from('ordens').insert([{
      ...form,
      status: STATUS_INICIAL,
      numero,
      valor_pecas,
      valor_servico,
      valor: valor_pecas + valor_servico,
      duracao_minutos: duracao ? (parseInt(duracao) || null) : null,
    }])
    setForm({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor_pecas: '', valor_servico: '', hora_inicio: '', hora_fim: '' })
    setTela('ordens')
    carregarOrdens()
  }

  async function salvarEdicao() {
    const valor_pecas = form.valor_pecas ? parseFloat(form.valor_pecas) : 0
    const valor_servico = form.valor_servico ? parseFloat(form.valor_servico) : 0
    await supabase.from('ordens').update({
      cliente: form.cliente,
      telefone: form.telefone,
      tipo: form.tipo,
      modelo: form.modelo,
      problema: form.problema,
      observacoes: form.observacoes,
      valor_pecas,
      valor_servico,
      valor: valor_pecas + valor_servico,
      hora_inicio: form.hora_inicio || null,
      hora_fim: form.hora_fim || null,
    }).eq('id', osEditando.id)
    setOsEditando(null)
    setForm({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor_pecas: '', valor_servico: '', hora_inicio: '', hora_fim: '' })
    setTela('ordens')
    carregarOrdens()
  }

  async function mudarStatus(id, novoStatus) {
    const update = { status: novoStatus }
    if (novoStatus === 'Entregue' || novoStatus === 'Não aprovado') {
      update.fechada_em = new Date().toISOString()
    }
    await supabase.from('ordens').update(update).eq('id', id)
    carregarOrdens()
  }

  async function excluirOS(id) {
    if (window.confirm('Tem certeza que deseja excluir esta OS?')) {
      await supabase.from('ordens').delete().eq('id', id)
      carregarOrdens()
    }
  }

  function abrirEdicao(os) {
    setOsEditando(os)
    setForm({
      cliente: os.cliente,
      telefone: os.telefone,
      tipo: os.tipo,
      modelo: os.modelo,
      problema: os.problema,
      observacoes: os.observacoes || '',
      valor_pecas: os.valor_pecas || '',
      valor_servico: os.valor_servico || '',
      hora_inicio: os.hora_inicio || '',
      hora_fim: os.hora_fim || '',
    })
    setTela('editar')
  }

  async function imprimirOS(os) {
    const { data: cfg } = await supabase.from('configuracoes').select('*').limit(1).single()
    const empresa = cfg || {}
    const janela = window.open('', '_blank')
    janela.document.write(`
      <html>
        <head>
          <title>OS #${String(os.numero).padStart(4, '0')}</title>
          <style>
            body { font-family: sans-serif; padding: 32px; color: #333; max-width: 680px; margin: 0 auto; }
            .cabecalho { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #185FA5; }
            .empresa-info { flex: 1; }
            .empresa-nome { font-size: 18px; font-weight: 700; color: #185FA5; margin-bottom: 4px; }
            .empresa-detalhe { font-size: 12px; color: #666; line-height: 1.6; }
            .logo-box { max-width: 160px; max-height: 70px; object-fit: contain; }
            .numero { font-size: 22px; font-weight: 600; margin-bottom: 20px; color: #333; }
            .secao { margin-bottom: 16px; }
            .secao label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px; }
            .secao p { font-size: 14px; margin: 0; color: #333; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; background: #EEF4FB; color: #185FA5; }
            .rodape { margin-top: 40px; border-top: 1px solid #E0E0E0; padding-top: 12px; font-size: 11px; color: #aaa; display: flex; justify-content: space-between; }
            .assinatura { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; }
            .linha-assinatura { border-top: 1px solid #333; padding-top: 8px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="cabecalho">
            <div class="empresa-info">
              ${empresa.logo_url ? `<img src="${empresa.logo_url}" class="logo-box" alt="Logo" />` : ''}
              <div class="empresa-nome">${empresa.nome_empresa || 'Supradesk'}</div>
              <div class="empresa-detalhe">
                ${empresa.cnpj ? `CNPJ: ${empresa.cnpj}<br>` : ''}
                ${empresa.telefone ? `Tel: ${empresa.telefone}<br>` : ''}
                ${empresa.email ? `${empresa.email}<br>` : ''}
                ${empresa.endereco ? `${empresa.endereco}${empresa.bairro ? ', ' + empresa.bairro : ''}${empresa.cidade ? ' — ' + empresa.cidade : ''}${empresa.cep ? ' — CEP ' + empresa.cep : ''}<br>` : ''}
                ${empresa.site ? empresa.site : ''}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px; color:#999; margin-bottom:4px;">ORDEM DE SERVIÇO</div>
              <div style="font-size:28px; font-weight:700; color:#185FA5;">#${String(os.numero).padStart(4, '0')}</div>
              <div style="font-size:12px; color:#666;">Abertura: ${new Date(os.created_at).toLocaleDateString('pt-BR')}</div>
              ${os.fechada_em ? `<div style="font-size:12px; color:#1D9E75;">Fechamento: ${new Date(os.fechada_em).toLocaleDateString('pt-BR')}</div>` : ''}
            </div>
          </div>

          <div class="grid">
            <div class="secao"><label>Cliente</label><p>${os.cliente}</p></div>
            <div class="secao"><label>Telefone</label><p>${os.telefone}</p></div>
          </div>
          <div class="grid">
            <div class="secao"><label>Equipamento</label><p>${os.tipo} — ${os.modelo}</p></div>
            <div class="secao"><label>Status</label><p><span class="status">${os.status}</span></p></div>
          </div>
          <div class="secao"><label>Problema relatado</label><p>${os.problema}</p></div>
          ${os.observacoes ? `<div class="secao"><label>Observações técnicas</label><p>${os.observacoes}</p></div>` : ''}
          ${(os.hora_inicio || os.hora_fim) ? `<div class="secao"><label>Horário do atendimento</label><p>${os.hora_inicio || '?'} às ${os.hora_fim || '?'}${(os.hora_inicio && os.hora_fim && calcularDuracao(os.hora_inicio, os.hora_fim)) ? ` (${calcularDuracao(os.hora_inicio, os.hora_fim)})` : ''}</p></div>` : ''}
          ${(os.valor_pecas > 0 || os.valor_servico > 0 || os.valor) ? `
          <div class="grid">
            ${(os.valor_pecas > 0) ? `<div class="secao"><label>Valor das peças</label><p>R$ ${parseFloat(os.valor_pecas).toFixed(2)}</p></div>` : ''}
            ${(os.valor_servico > 0) ? `<div class="secao"><label>Valor do serviço</label><p>R$ ${parseFloat(os.valor_servico).toFixed(2)}</p></div>` : ''}
          </div>
          <div class="secao"><label>Valor total</label><p style="font-size:20px; font-weight:700; color:#1D9E75;">R$ ${parseFloat(os.valor || ((os.valor_pecas||0) + (os.valor_servico||0))).toFixed(2)}</p></div>` : ''}

          <div class="assinatura">
            <div><div class="linha-assinatura">Assinatura do cliente</div></div>
            <div><div class="linha-assinatura">Assinatura do técnico</div></div>
          </div>

          <div class="rodape">
            <span>Gerado pelo Supradesk — sistema de gestão para assistências técnicas</span>
            <span>${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </body>
      </html>
    `)
    janela.document.close()
    janela.print()
  }

  function hexParaRgba(hex, alpha) {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  function statusInfo(status) {
    const s = STATUS[status]
    const cor = s ? s.cor : cores.aguardando
    return { cor, bg: hexParaRgba(cor, modo === 'dark' ? 0.15 : 0.12), icone: s ? s.icone : '•' }
  }

  function diasAberta(created_at) {
    const dias = Math.floor((new Date() - new Date(created_at)) / (1000 * 60 * 60 * 24))
    if (dias === 0) return 'Hoje'
    if (dias === 1) return '1 dia'
    return `${dias} dias`
  }

  function proximoStatusDe(status) {
    return STATUS[status] ? STATUS[status].proximo : null
  }

  const ordensFiltradas = ordens.filter(o => {
    const buscaOk = o.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      o.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      o.telefone.includes(busca)
    let filtroOk
    if (filtroStatus === '__abertos__') filtroOk = STATUS_ABERTOS.includes(o.status)
    else if (filtroStatus === '') filtroOk = true
    else filtroOk = o.status === filtroStatus
    return buscaOk && filtroOk
  })

  const totalReceita = ordens.filter(o => o.status === 'Entregue' && o.valor).reduce((acc, o) => acc + parseFloat(o.valor), 0)

  const contagem = {
    total: ordens.length,
    recebido: ordens.filter(o => o.status === 'Recebido').length,
    orcamento: ordens.filter(o => o.status === 'Orçamento').length,
    aprovacao: ordens.filter(o => o.status === 'Aguardando aprovação').length,
    reparo: ordens.filter(o => o.status === 'Em reparo').length,
    pronto: ordens.filter(o => o.status === 'Pronto').length,
    entregue: ordens.filter(o => o.status === 'Entregue').length,
    naoAprovado: ordens.filter(o => o.status === 'Não aprovado').length,
    emAberto: ordens.filter(o => STATUS_ABERTOS.includes(o.status)).length,
  }

  // Lista de status na ordem do fluxo, com contagem (para cards e gráficos)
  const statusFluxo = Object.keys(STATUS).map(nome => ({
    nome,
    cor: STATUS[nome].cor,
    icone: STATUS[nome].icone,
    n: ordens.filter(o => o.status === nome).length,
  }))
  const maxBarra = Math.max(...statusFluxo.map(s => s.n), 1)

  // Clientes com OS em aberto (equipamento ainda na empresa), agrupado por nome
  const clientesEmAberto = (() => {
    const mapa = {}
    ordens.filter(o => STATUS_ABERTOS.includes(o.status)).forEach(o => {
      const nome = (o.cliente || 'Sem nome').trim()
      if (!mapa[nome]) mapa[nome] = { nome, telefone: o.telefone, total: 0 }
      mapa[nome].total += 1
    })
    return Object.values(mapa).sort((a, b) => b.total - a.total)
  })()

  // ===== RELATÓRIOS =====
  // Faturamento por período (considera OS Entregues com valor, pela data de criação)
  const relatorioFaturamento = (() => {
    const ini = relInicio ? new Date(relInicio + 'T00:00:00') : null
    const fim = relFim ? new Date(relFim + 'T23:59:59') : null
    const base = ordens.filter(o => {
      if (relStatus === '__abertos__') return STATUS_ABERTOS.includes(o.status)
      if (relStatus) return o.status === relStatus
      return true
    }).filter(o => o.valor)
    const noPeriodo = base.filter(o => {
      const d = new Date(o.created_at)
      if (ini && d < ini) return false
      if (fim && d > fim) return false
      return true
    })
    const total = noPeriodo.reduce((acc, o) => acc + parseFloat(o.valor), 0)
    const qtd = noPeriodo.length
    const ticket = qtd > 0 ? total / qtd : 0
    return { total, qtd, ticket }
  })()

  // Ranking de equipamentos mais atendidos
  const rankingEquipamentos = (() => {
    const mapa = {}
    ordens.filter(o => {
      if (relStatus === '__abertos__') return STATUS_ABERTOS.includes(o.status)
      if (relStatus) return o.status === relStatus
      return true
    }).forEach(o => {
      const tipo = o.tipo || 'Outro'
      mapa[tipo] = (mapa[tipo] || 0) + 1
    })
    return Object.entries(mapa).map(([tipo, qtd]) => ({ tipo, qtd })).sort((a, b) => b.qtd - a.qtd)
  })()

  // Top clientes (mais OS no total)
  const topClientes = (() => {
    const mapa = {}
    ordens.filter(o => {
      if (relStatus === '__abertos__') return STATUS_ABERTOS.includes(o.status)
      if (relStatus) return o.status === relStatus
      return true
    }).forEach(o => {
      const nome = (o.cliente || 'Sem nome').trim()
      if (!mapa[nome]) mapa[nome] = { nome, qtd: 0, receita: 0 }
      mapa[nome].qtd += 1
      if (o.status === 'Entregue' && o.valor) mapa[nome].receita += parseFloat(o.valor)
    })
    return Object.values(mapa).sort((a, b) => b.qtd - a.qtd).slice(0, 10)
  })()

  // estilos reutilizáveis
  const inputStyle = { width: '100%', padding: '11px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto }
  const labelStyle = { fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6, textAlign: 'left' }
  const cardStyle = { background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 16 }

  const menu = [
    { id: 'dashboard', icone: '▦', label: 'Painel' },
    { id: 'ordens', icone: '▤', label: 'Ordens de Serviço' },
    { id: 'clientes', icone: '◍', label: 'Clientes' },
    { id: 'pecas', icone: '◆', label: 'Peças' },
    { id: 'estoque', icone: '▥', label: 'Estoque' },
    { id: 'relatorios', icone: '▦', label: 'Relatórios' },
    { id: 'config', icone: '⚙', label: 'Configurações' },
  ]

  // Atalhos do painel inicial
  const atalhos = [
    { id: 'nova',      icone: '📝', cor: cores.reparo,   label: 'Nova OS',              acao: () => abrirNovaOS() },
    { id: 'layouts',   icone: '📁', cor: '#7C5CD6',       label: 'Layouts Clientes',     acao: () => setTela('layouts') },
    { id: 'clientes',  icone: '👥', cor: '#9BB5D4',       label: 'Clientes',             acao: () => setTela('clientes') },
    { id: 'relatorios',icone: '📊', cor: cores.aguardando,label: 'Relatórios',           acao: () => setTela('relatorios') },
    { id: 'config',    icone: '⚙', cor: '#9BB5D4',       label: 'Configurações',        acao: () => setTela('config') },
    { id: 'recebido',  icone: STATUS['Recebido'].icone,           cor: STATUS['Recebido'].cor,           label: 'Recebido',             acao: () => { setFiltroStatus('Recebido'); setTela('ordens') } },
    { id: 'orcamento', icone: STATUS['Orçamento'].icone,          cor: STATUS['Orçamento'].cor,          label: 'Orçamento',            acao: () => { setFiltroStatus('Orçamento'); setTela('ordens') } },
    { id: 'aprovacao', icone: STATUS['Aguardando aprovação'].icone,cor: STATUS['Aguardando aprovação'].cor,label: 'Aguard. aprovação',   acao: () => { setFiltroStatus('Aguardando aprovação'); setTela('ordens') } },
    { id: 'reparo',    icone: STATUS['Em reparo'].icone,           cor: STATUS['Em reparo'].cor,          label: 'Em reparo',            acao: () => { setFiltroStatus('Em reparo'); setTela('ordens') } },
    { id: 'pronto',    icone: STATUS['Pronto'].icone,              cor: STATUS['Pronto'].cor,             label: 'Prontas',              acao: () => { setFiltroStatus('Pronto'); setTela('ordens') } },
    { id: 'entregue',  icone: STATUS['Entregue'].icone,            cor: STATUS['Entregue'].cor,           label: 'Entregues',            acao: () => { setFiltroStatus('Entregue'); setTela('ordens') } },
    { id: 'nao_aprov', icone: STATUS['Não aprovado'].icone,        cor: STATUS['Não aprovado'].cor,       label: 'Não aprovados',        acao: () => { setFiltroStatus('Não aprovado'); setTela('ordens') } },
    { id: 'abertos',   icone: '📂', cor: cores.aguardando,         label: 'Todos em aberto',              acao: () => { setFiltroStatus('__abertos__'); setTela('ordens') } },
  ]

  const formularioOS = (
    <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.cardBorda}`, padding: isMobile ? 16 : 28, maxWidth: isMobile ? '100%' : 680, fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 11, fontWeight: '500', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, marginTop: 0 }}>Dados do cliente</p>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Cliente</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={form.cliente} onChange={e => selecionarCliente(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            <option value="">Selecione um cliente...</option>
            {listaClientes.map(c => (
              <option key={c.id} value={c.nome}>{c.nome}</option>
            ))}
            <option value="__novo__">+ Cadastrar novo cliente</option>
          </select>
          <button type="button" onClick={() => setMostrarNovoCliente(true)} style={{ background: t.azul, color: '#fff', border: 'none', padding: '0 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '500' }}>+ Novo</button>
        </div>
      </div>

      {mostrarNovoCliente && (
        <div style={{ background: modo === 'dark' ? 'rgba(255,255,255,0.03)' : '#F9FAFB', border: `1px solid ${t.cardBorda}`, borderRadius: 10, padding: 18, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: '500', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Cadastrar novo cliente</p>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Nome completo</label>
            <input value={novoCliente.nome} onChange={e => setNovoCliente({ ...novoCliente, nome: e.target.value })} type="text" placeholder="Ex: João Silva" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Telefone / WhatsApp</label>
            <input value={novoCliente.telefone} onChange={e => setNovoCliente({ ...novoCliente, telefone: e.target.value })} type="text" placeholder="(49) 99999-0000" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>E-mail</label>
            <input value={novoCliente.email} onChange={e => setNovoCliente({ ...novoCliente, email: e.target.value })} type="email" placeholder="cliente@email.com" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>CPF</label>
            <input value={novoCliente.cpf} onChange={e => setNovoCliente({ ...novoCliente, cpf: e.target.value })} type="text" placeholder="000.000.000-00" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Endereço</label>
            <input value={novoCliente.endereco} onChange={e => setNovoCliente({ ...novoCliente, endereco: e.target.value })} type="text" placeholder="Rua, número, bairro, cidade" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setMostrarNovoCliente(false); setNovoCliente({ nome: '', telefone: '', email: '', cpf: '', endereco: '' }) }} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            <button type="button" onClick={salvarNovoClienteInline} style={{ background: cores.pronto, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: '500' }}>Salvar cliente</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Telefone / WhatsApp</label>
        <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} type="text" placeholder="(49) 99999-0000" style={inputStyle} />
      </div>
      <p style={{ fontSize: 11, fontWeight: '500', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, marginTop: 28 }}>Equipamento</p>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Tipo</label>
        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
          <option>Notebook</option>
          <option>Nobreak</option>
          <option>Placa-mãe</option>
          <option>Desktop</option>
          <option>Outro</option>
        </select>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Marca / Modelo</label>
        <input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} type="text" placeholder="Ex: Dell Inspiron 15" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Problema relatado</label>
        <textarea value={form.problema} onChange={e => setForm({ ...form, problema: e.target.value })} placeholder="Descreva o que o cliente relatou..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Observações técnicas</label>
        <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="O que foi feito, peças trocadas, diagnóstico..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <p style={{ fontSize: 11, fontWeight: '500', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, marginTop: 28 }}>Valores</p>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Valor das peças (R$)</label>
        <input value={form.valor_pecas} onChange={e => setForm({ ...form, valor_pecas: e.target.value })} type="number" placeholder="0,00" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Valor do serviço (R$)</label>
        <input value={form.valor_servico} onChange={e => setForm({ ...form, valor_servico: e.target.value })} type="number" placeholder="0,00" style={inputStyle} />
      </div>
      {(form.valor_pecas || form.valor_servico) && (
        <div style={{ background: modo === 'dark' ? 'rgba(29,158,117,0.12)' : '#E8F5EE', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: t.textoSuave, fontSize: 13 }}>Total</span>
          <span style={{ color: cores.pronto, fontSize: 18, fontWeight: '600' }}>R$ {((parseFloat(form.valor_pecas) || 0) + (parseFloat(form.valor_servico) || 0)).toFixed(2)}</span>
        </div>
      )}

      <p style={{ fontSize: 11, fontWeight: '500', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, marginTop: 28 }}>Horário do atendimento</p>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Início</label>
        <input value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })} type="time" style={{ ...inputStyle, colorScheme: modo === 'dark' ? 'dark' : 'light' }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Fim</label>
        <input value={form.hora_fim} onChange={e => setForm({ ...form, hora_fim: e.target.value })} type="time" style={{ ...inputStyle, colorScheme: modo === 'dark' ? 'dark' : 'light' }} />
      </div>
      {form.hora_inicio && form.hora_fim && calcularDuracao(form.hora_inicio, form.hora_fim) && (
        <div style={{ background: modo === 'dark' ? 'rgba(55,138,221,0.12)' : '#EEF4FB', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: t.textoSuave, fontSize: 13 }}>Duração</span>
          <span style={{ color: cores.reparo, fontSize: 16, fontWeight: '600' }}>⏱ {calcularDuracao(form.hora_inicio, form.hora_fim)}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={() => { setTela('ordens'); setOsEditando(null); setForm({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor_pecas: '', valor_servico: '' }) }} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={osEditando ? salvarEdicao : salvarOS} style={{ background: t.azul, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: '500' }}>
          {osEditando ? 'Salvar alterações' : 'Abrir OS'}
        </button>
      </div>
    </div>
  )

  const nomeUsuario = sessao?.user?.email ? sessao.user.email.split('@')[0] : 'Usuário'

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: t.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Header mobile */}
      {isMobile && (
        <div style={{ background: t.sidebar, borderBottom: `1px solid ${t.cardBorda}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <Logo modo={modo} tamanho={0.45} comSlogan={false} />
          <button onClick={() => setMenuMobileAberto(!menuMobileAberto)} style={{ background: 'transparent', border: `1px solid ${t.borda}`, color: t.textoSuave, padding: '8px 12px', borderRadius: 8, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>
            {menuMobileAberto ? '✕' : '☰'}
          </button>
        </div>
      )}

      {/* Menu mobile dropdown */}
      {isMobile && menuMobileAberto && (
        <div style={{ background: t.sidebar, borderBottom: `1px solid ${t.cardBorda}`, padding: '8px', zIndex: 99 }}>
          <div style={{ padding: '8px 12px', color: t.textoFraco, fontSize: 11 }}>Bem-vindo, {nomeUsuario}</div>
          {menu.map(m => {
            const ativo = tela === m.id || (tela === 'nova' && m.id === 'ordens') || (tela === 'editar' && m.id === 'ordens')
            return (
              <div key={m.id} onClick={() => { setTela(m.id); setMenuMobileAberto(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: ativo ? t.ativoMenu : 'transparent', color: ativo ? t.azul : t.textoSuave, fontSize: 14, cursor: 'pointer', marginBottom: 2 }}>
                <span>{m.icone}</span> {m.label}
              </div>
            )
          })}
          <div style={{ borderTop: `1px solid ${t.cardBorda}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
            <button onClick={alternar} style={{ background: 'transparent', border: `1px solid ${t.borda}`, color: t.textoSuave, padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              {modo === 'dark' ? '☀ Claro' : '🌙 Escuro'}
            </button>
            <button onClick={onSair} style={{ background: 'transparent', border: 'none', color: t.textoFraco, fontSize: 12, cursor: 'pointer' }}>Sair →</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1 }}>

      {/* Sidebar — só no desktop */}
      {!isMobile && (
        <div style={{ width: 220, background: t.sidebar, borderRight: `1px solid ${t.cardBorda}`, padding: '18px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 16px' }}>
          <Logo modo={modo} tamanho={0.6} comSlogan={false} />
        </div>
        <div style={{ padding: '0 16px 14px', borderBottom: `1px solid ${t.cardBorda}`, marginBottom: 10 }}>
          <div style={{ color: t.textoFraco, fontSize: 11 }}>Bem-vindo</div>
          <div style={{ color: t.textoSuave, fontSize: 13, fontWeight: '500', textTransform: 'capitalize' }}>{nomeUsuario}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          {menu.map(m => {
            const ativo = tela === m.id || (tela === 'nova' && m.id === 'ordens') || (tela === 'editar' && m.id === 'ordens')
            return (
              <div key={m.id} onClick={() => { setTela(m.id); setFiltroStatus('') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: ativo ? t.ativoMenu : 'transparent', color: ativo ? t.azul : t.textoFraco, fontSize: 13, fontWeight: ativo ? '500' : 'normal', cursor: 'pointer' }}>
                <span style={{ fontSize: 15 }}>{m.icone}</span> {m.label}
              </div>
            )
          })}
        </div>
        <div style={{ padding: '14px 16px', marginTop: 10, borderTop: `1px solid ${t.cardBorda}` }}>
          <button onClick={alternar} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: `1px solid ${t.borda}`, color: t.textoSuave, padding: '8px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', width: '100%', marginBottom: 8 }}>
            {modo === 'dark' ? '☀ Tema claro' : '🌙 Tema escuro'}
          </button>
          <button onClick={onSair} style={{ background: 'transparent', border: 'none', color: t.textoFraco, fontSize: 12, cursor: 'pointer', padding: 0 }}>Sair →</button>
        </div>
      </div>
      )}

      {/* Conteúdo */}
      <div style={{ flex: 1, padding: isMobile ? 16 : 28, overflowX: 'hidden' }}>
        <div style={{ maxWidth: 1680, margin: '0 auto' }}>

        {tela !== 'dashboard' && (
          <button onClick={() => setTela('dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: t.azul, border: `1px solid ${t.azul}`, padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: '500', marginBottom: 16 }}>
            🏠 Painel
          </button>
        )}

        {/* DASHBOARD */}
        {tela === 'dashboard' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div>
                <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>Painel</h1>
                <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>O que você quer fazer hoje?</p>
              </div>
              <button onClick={abrirNovaOS} style={{ background: t.azul, color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontWeight: '500', boxShadow: `0 4px 14px ${modo === 'dark' ? 'rgba(55,138,221,0.35)' : 'rgba(24,95,165,0.25)'}` }}>+ Nova OS</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              {atalhos.map(a => {
                const hover = hoverCard === 'atalho-' + a.id
                return (
                  <div key={a.id} onClick={a.acao}
                    onMouseEnter={() => setHoverCard('atalho-' + a.id)}
                    onMouseLeave={() => setHoverCard(null)}
                    style={{ background: t.card, border: `1px solid ${hover ? a.cor : t.cardBorda}`, borderRadius: 14, padding: '22px 12px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease', transform: hover ? 'translateY(-4px)' : 'translateY(0)', boxShadow: hover ? (modo === 'dark' ? '0 10px 24px rgba(0,0,0,0.45)' : '0 10px 24px rgba(0,0,0,0.12)') : (modo === 'dark' ? '0 3px 12px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.06)') }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: a.cor + '26', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>{a.icone}</div>
                    <div style={{ color: t.textoSuave, fontSize: 13, fontWeight: '500' }}>{a.label}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ color: t.textoSuave, fontSize: 13, fontWeight: '500', marginBottom: 12 }}>Situação das OS</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'EM ABERTO (NA EMPRESA)', valor: contagem.emAberto, cor: '#9BB5D4', icone: '📥', id: 'aberto', filtro: '' },
                { label: 'AGUARDANDO APROVAÇÃO', valor: contagem.aprovacao, cor: STATUS['Aguardando aprovação'].cor, icone: '⏳', id: 'aprovacao', filtro: 'Aguardando aprovação' },
                { label: 'PRONTAS P/ ENTREGA', valor: contagem.pronto, cor: cores.pronto, icone: '✅', id: 'pronto', filtro: 'Pronto' },
                { label: 'RECEITA (ENTREGUES)', valor: `R$ ${totalReceita.toFixed(2)}`, cor: '#7C5CD6', icone: '💰', id: 'receita', filtro: '' },
              ].map(c => {
                const hover = hoverCard === 'sit-' + c.id
                return (
                  <div key={c.label}
                    onClick={() => { if (c.filtro !== undefined && c.id !== 'receita') { setFiltroStatus(c.filtro); setTela('ordens') } }}
                    onMouseEnter={() => setHoverCard('sit-' + c.id)}
                    onMouseLeave={() => setHoverCard(null)}
                    style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, position: 'relative', overflow: 'hidden', cursor: c.id !== 'receita' ? 'pointer' : 'default', transition: 'transform 0.18s ease, box-shadow 0.18s ease', transform: hover ? 'translateY(-4px)' : 'translateY(0)', boxShadow: hover ? (modo === 'dark' ? '0 10px 24px rgba(0,0,0,0.45)' : '0 10px 24px rgba(0,0,0,0.12)') : (modo === 'dark' ? '0 2px 10px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)') }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c.cor }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em' }}>{c.label}</span>
                      <span style={{ fontSize: 17 }}>{c.icone}</span>
                    </div>
                    <div style={{ color: t.texto, fontSize: 28, fontWeight: '500', marginTop: 8 }}>{c.valor}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 18 }}>OS por status</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 160, padding: '0 6px' }}>
                {statusFluxo.map(b => (
                  <div key={b.nome} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: t.textoSuave, fontSize: 13, fontWeight: '500' }}>{b.n}</span>
                    <div style={{ width: '100%', maxWidth: 56, height: Math.max((b.n / maxBarra) * 110, 4), background: b.cor, borderRadius: '6px 6px 0 0', transition: 'height 0.3s' }}></div>
                    <span style={{ color: t.textoFraco, fontSize: 10, textAlign: 'center', lineHeight: 1.2 }}>{b.nome}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>Clientes com OS em aberto</div>
              <div style={{ color: t.textoFraco, fontSize: 12, marginBottom: 14 }}>Equipamentos que ainda estão na empresa (não entregues)</div>
              {clientesEmAberto.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: t.textoFraco, fontSize: 13 }}>Nenhuma OS em aberto no momento.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: t.textoFraco, fontWeight: '500', fontSize: 12 }}>Cliente</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: t.textoFraco, fontWeight: '500', fontSize: 12 }}>Telefone</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: t.textoFraco, fontWeight: '500', fontSize: 12 }}>OS em aberto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesEmAberto.map((c) => (
                      <tr key={c.nome} style={{ borderTop: `1px solid ${t.cardBorda}` }}>
                        <td style={{ padding: '12px', color: t.texto, fontWeight: '500' }}>{c.nome}</td>
                        <td style={{ padding: '12px', color: t.textoSuave }}>{c.telefone || '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <span style={{ background: modo === 'dark' ? 'rgba(55,138,221,0.15)' : '#EEF4FB', color: cores.reparo, padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: '500' }}>{c.total}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ORDENS */}
        {tela === 'ordens' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>Ordens de Serviço</h1>
                {totalReceita > 0 && <p style={{ fontSize: 13, color: cores.pronto, margin: '4px 0 0', fontWeight: '500' }}>Receita entregues: R$ {totalReceita.toFixed(2)}</p>}
              </div>
              <button onClick={abrirNovaOS} style={{ background: t.azul, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: '500' }}>
                + Nova OS
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 13, marginBottom: 18 }}>
              {[
                { label: 'TOTAL', valor: contagem.total, cor: t.azul, icone: '📋', filtro: '', id: 'total' },
                ...statusFluxo.map(s => ({ label: s.nome.toUpperCase(), valor: s.n, cor: s.cor, icone: s.icone, filtro: s.nome, id: s.nome }))
              ].map(c => {
                const ativo = filtroStatus === c.filtro && !(c.filtro === '' && filtroStatus !== '')
                const hover = hoverCard === 'filtro-' + c.id
                return (
                  <div key={c.id}
                    onClick={() => setFiltroStatus(ativo && c.filtro !== '' ? '' : c.filtro)}
                    onMouseEnter={() => setHoverCard('filtro-' + c.id)}
                    onMouseLeave={() => setHoverCard(null)}
                    style={{ background: ativo ? c.cor : t.card, border: `1px solid ${ativo ? c.cor : t.cardBorda}`, borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease', transform: hover ? 'translateY(-4px)' : 'translateY(0)', boxShadow: hover ? (modo === 'dark' ? '0 10px 24px rgba(0,0,0,0.45)' : '0 10px 24px rgba(0,0,0,0.12)') : (modo === 'dark' ? '0 2px 10px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)') }}>
                    {!ativo && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c.cor }}></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ color: ativo ? 'rgba(255,255,255,0.85)' : t.textoFraco, fontSize: 11, letterSpacing: '0.04em' }}>{c.label}</span>
                      <span style={{ fontSize: 16 }}>{c.icone}</span>
                    </div>
                    <div style={{ color: ativo ? '#fff' : t.texto, fontSize: 24, fontWeight: '500', marginTop: 8 }}>{c.valor}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginBottom: 16 }}>
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por cliente, modelo ou telefone..." style={inputStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ordensFiltradas.length === 0 ? (
                <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.cardBorda}`, padding: 48, textAlign: 'center', color: t.textoFraco }}>
                  <p style={{ fontSize: 16, marginBottom: 8 }}>{busca ? 'Nenhuma OS encontrada' : 'Nenhuma OS cadastrada ainda'}</p>
                  <p style={{ fontSize: 13 }}>{busca ? 'Tente outro termo' : 'Clique em + Nova OS para começar'}</p>
                </div>
              ) : ordensFiltradas.map((os) => {
                const { cor, bg } = statusInfo(os.status)
                const expandido = osExpandida === os.id
                return (
                  <div key={os.id} style={{ background: t.card, borderRadius: 12, border: `1px solid ${expandido ? cor : t.cardBorda}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    {/* Cabeçalho do card — sempre visível */}
                    <div onClick={() => setOsExpandida(expandido ? null : os.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 4, height: 36, borderRadius: 2, background: cor }}></div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: t.textoFraco, fontFamily: 'monospace', fontSize: 12 }}>#{String(os.numero || 0).padStart(4, '0')}</span>
                          <span style={{ color: t.texto, fontWeight: '500', fontSize: 14 }}>{os.cliente}</span>
                          <span style={{ color: t.textoFraco, fontSize: 12 }}>•</span>
                          <span style={{ color: t.textoSuave, fontSize: 13 }}>{os.tipo} {os.modelo}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span style={{ background: bg, color: cor, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: '500' }}>{STATUS[os.status]?.icone} {os.status}</span>
                          <span style={{ color: t.textoFraco, fontSize: 11 }}>{diasAberta(os.created_at)}</span>
                          {os.valor && <span style={{ color: cores.pronto, fontSize: 12, fontWeight: '500' }}>R$ {parseFloat(os.valor).toFixed(2)}</span>}
                        </div>
                      </div>
                      <span style={{ color: t.textoFraco, fontSize: 18, flexShrink: 0, transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>⌄</span>
                    </div>

                    {/* Detalhes — só quando expandido */}
                    {expandido && (
                      <div style={{ borderTop: `1px solid ${t.cardBorda}`, padding: '16px 16px 16px 32px' }}>
                        {os.problema && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 4 }}>PROBLEMA RELATADO</div>
                            <div style={{ color: t.textoSuave, fontSize: 14 }}>{os.problema}</div>
                          </div>
                        )}
                        {os.observacoes && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 4 }}>OBSERVAÇÕES TÉCNICAS</div>
                            <div style={{ color: t.textoSuave, fontSize: 14 }}>{os.observacoes}</div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 2 }}>TELEFONE</div>
                            <div style={{ color: t.textoSuave, fontSize: 13 }}>{os.telefone || '—'}</div>
                          </div>
                          <div>
                            <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 2 }}>VALOR</div>
                            <div style={{ color: os.valor ? cores.pronto : t.textoFraco, fontSize: 13, fontWeight: '500' }}>{os.valor ? `R$ ${parseFloat(os.valor).toFixed(2)}` : '—'}</div>
                          </div>
                          <div>
                            <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 2 }}>DATA DE ABERTURA</div>
                            <div style={{ color: t.textoSuave, fontSize: 13 }}>{new Date(os.created_at).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <div>
                            <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 2 }}>TEMPO ABERTA</div>
                            <div style={{ color: t.textoSuave, fontSize: 13 }}>{diasAberta(os.created_at)}</div>
                          </div>
                          {os.fechada_em && (
                            <div>
                              <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 2 }}>DATA DE FECHAMENTO</div>
                              <div style={{ color: cores.pronto, fontSize: 13, fontWeight: '500' }}>{new Date(os.fechada_em).toLocaleDateString('pt-BR')}</div>
                            </div>
                          )}
                          {(os.hora_inicio || os.hora_fim) && (
                            <div>
                              <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 2 }}>HORÁRIO</div>
                              <div style={{ color: t.textoSuave, fontSize: 13 }}>{os.hora_inicio || '?'} → {os.hora_fim || '?'} {os.hora_inicio && os.hora_fim && calcularDuracao(os.hora_inicio, os.hora_fim) ? `(${calcularDuracao(os.hora_inicio, os.hora_fim)})` : ''}</div>
                            </div>
                          )}
                          {(os.valor_pecas > 0 || os.valor_servico > 0) && (
                            <>
                              <div>
                                <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 2 }}>PEÇAS</div>
                                <div style={{ color: t.textoSuave, fontSize: 13 }}>R$ {parseFloat(os.valor_pecas || 0).toFixed(2)}</div>
                              </div>
                              <div>
                                <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em', marginBottom: 2 }}>SERVIÇO</div>
                                <div style={{ color: t.textoSuave, fontSize: 13 }}>R$ {parseFloat(os.valor_servico || 0).toFixed(2)}</div>
                              </div>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {proximoStatusDe(os.status) && (
                            <button onClick={() => mudarStatus(os.id, proximoStatusDe(os.status))} style={{ background: t.azul, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: '500' }}>→ {proximoStatusDe(os.status)}</button>
                          )}
                          {os.status === 'Aguardando aprovação' && (
                            <button onClick={() => mudarStatus(os.id, 'Não aprovado')} style={{ background: 'transparent', color: cores.perigo, border: `1px solid ${cores.perigo}`, padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Não aprovado</button>
                          )}
                          <button onClick={() => abrirEdicao(os)} style={{ background: 'transparent', color: cores.aguardando, border: `1px solid ${cores.aguardando}`, padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>✏ Editar</button>
                          <button onClick={() => imprimirOS(os)} style={{ background: 'transparent', color: cores.reparo, border: `1px solid ${cores.reparo}`, padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🖨 Imprimir</button>
                          <button onClick={() => excluirOS(os.id)} style={{ background: 'transparent', color: cores.perigo, border: `1px solid ${cores.perigo}`, padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>🗑 Excluir</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* NOVA / EDITAR */}
        {(tela === 'nova' || tela === 'editar') && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, maxWidth: 680 }}>
              <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>
                {tela === 'editar' ? `Editando OS #${String(osEditando?.numero || 0).padStart(4, '0')}` : 'Nova OS'}
              </h1>
              <button onClick={() => { setTela('ordens'); setOsEditando(null) }} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>← Voltar</button>
            </div>
            {formularioOS}
          </>
        )}

        {/* CLIENTES */}
        {tela === 'clientes' && <Clientes t={t} modo={modo} />}

        {/* LAYOUTS CLIENTES */}
        {tela === 'layouts' && <LayoutsClientes t={t} modo={modo} />}

        {/* RELATÓRIOS */}
        {tela === 'relatorios' && (
          <>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>Relatórios</h1>
              <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>Acompanhe os números da sua assistência</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'Todos', filtro: '' },
                { label: '📥 Recebido', filtro: 'Recebido' },
                { label: '🧾 Orçamento', filtro: 'Orçamento' },
                { label: '⏳ Aguardando aprovação', filtro: 'Aguardando aprovação' },
                { label: '🔧 Em reparo', filtro: 'Em reparo' },
                { label: '✅ Pronto', filtro: 'Pronto' },
                { label: '📦 Entregue', filtro: 'Entregue' },
                { label: '🚫 Não aprovado', filtro: 'Não aprovado' },
                { label: '📂 Em aberto', filtro: '__abertos__' },
              ].map(f => {
                const ativo = relStatus === f.filtro
                const s = STATUS[f.filtro]
                const cor = s ? s.cor : t.azul
                return (
                  <div key={f.filtro} onClick={() => setRelStatus(f.filtro)} style={{ background: ativo ? cor : t.card, color: ativo ? '#fff' : t.textoSuave, border: `1px solid ${ativo ? cor : t.cardBorda}`, borderRadius: 20, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontWeight: ativo ? '500' : 'normal' }}>
                    {f.label}
                  </div>
                )
              })}
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>Faturamento por período</div>
              <div style={{ color: t.textoFraco, fontSize: 12, marginBottom: 14 }}>Baseado nas OS entregues com valor lançado</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18 }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: 12 }}>De</label>
                  <input type="date" value={relInicio} onChange={e => setRelInicio(e.target.value)} style={{ ...inputStyle, width: 'auto', colorScheme: modo === 'dark' ? 'dark' : 'light' }} />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: 12 }}>Até</label>
                  <input type="date" value={relFim} onChange={e => setRelFim(e.target.value)} style={{ ...inputStyle, width: 'auto', colorScheme: modo === 'dark' ? 'dark' : 'light' }} />
                </div>
                {(relInicio || relFim) && (
                  <button onClick={() => { setRelInicio(''); setRelFim('') }} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Limpar</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 13 }}>
                <div style={{ background: modo === 'dark' ? 'rgba(29,158,117,0.10)' : '#E8F5EE', borderRadius: 10, padding: 16 }}>
                  <p style={{ fontSize: 11, color: t.textoFraco, margin: '0 0 8px', letterSpacing: '0.04em' }}>FATURAMENTO</p>
                  <p style={{ fontSize: 24, fontWeight: '500', color: cores.pronto, margin: 0 }}>R$ {relatorioFaturamento.total.toFixed(2)}</p>
                </div>
                <div style={cardStyle}>
                  <p style={{ fontSize: 11, color: t.textoFraco, margin: '0 0 8px', letterSpacing: '0.04em' }}>OS ENTREGUES</p>
                  <p style={{ fontSize: 24, fontWeight: '500', color: t.texto, margin: 0 }}>{relatorioFaturamento.qtd}</p>
                </div>
                <div style={cardStyle}>
                  <p style={{ fontSize: 11, color: t.textoFraco, margin: '0 0 8px', letterSpacing: '0.04em' }}>TICKET MÉDIO</p>
                  <p style={{ fontSize: 24, fontWeight: '500', color: t.texto, margin: 0 }}>R$ {relatorioFaturamento.ticket.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18 }}>
                <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 14 }}>OS por status</div>
                {statusFluxo.map(s => (
                  <div key={s.nome} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ width: 130, fontSize: 12, color: t.textoSuave }}>{s.icone} {s.nome}</span>
                    <div style={{ flex: 1, background: modo === 'dark' ? 'rgba(255,255,255,0.06)' : '#EEE', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${contagem.total > 0 ? (s.n / contagem.total) * 100 : 0}%`, height: '100%', background: s.cor }}></div>
                    </div>
                    <span style={{ width: 28, textAlign: 'right', fontSize: 13, color: t.texto, fontWeight: '500' }}>{s.n}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18 }}>
                <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 14 }}>Equipamentos mais atendidos</div>
                {rankingEquipamentos.length === 0 ? (
                  <div style={{ color: t.textoFraco, fontSize: 13, padding: '12px 0' }}>Sem dados ainda.</div>
                ) : rankingEquipamentos.map(e => (
                  <div key={e.tipo} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.cardBorda}` }}>
                    <span style={{ fontSize: 13, color: t.textoSuave }}>{e.tipo}</span>
                    <span style={{ fontSize: 13, color: t.texto, fontWeight: '500' }}>{e.qtd}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18 }}>
              <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 14 }}>Top clientes (mais OS)</div>
              {topClientes.length === 0 ? (
                <div style={{ color: t.textoFraco, fontSize: 13, padding: '12px 0' }}>Sem dados ainda.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: t.textoFraco, fontWeight: '500', fontSize: 12 }}>Cliente</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: t.textoFraco, fontWeight: '500', fontSize: 12 }}>Total de OS</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: t.textoFraco, fontWeight: '500', fontSize: 12 }}>Receita gerada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClientes.map(c => (
                      <tr key={c.nome} style={{ borderTop: `1px solid ${t.cardBorda}` }}>
                        <td style={{ padding: '10px 12px', color: t.texto, fontWeight: '500' }}>{c.nome}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: t.textoSuave }}>{c.qtd}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: cores.pronto, fontWeight: '500' }}>R$ {c.receita.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* PEÇAS (em breve) */}
        {tela === 'pecas' && (
          <div style={{ color: t.textoFraco, textAlign: 'center', padding: 60 }}>
            <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500' }}>Peças</h1>
            <p>Em breve: cadastro de peças com preço de custo, venda e quantidade.</p>
          </div>
        )}

        {/* ESTOQUE (em breve) */}
        {tela === 'estoque' && (
          <div style={{ color: t.textoFraco, textAlign: 'center', padding: 60 }}>
            <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500' }}>Estoque</h1>
            <p>Em breve: controle de entrada de peças e lançamento nas OS.</p>
          </div>
        )}

        {/* CONFIG */}
        {tela === 'config' && <Configuracoes t={t} modo={modo} />}

        </div>
      </div>
      </div>

      {/* MODAL ANOTAÇÕES */}
      {modalAnotacoes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.cardBorda}`, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.cardBorda}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: t.texto, fontSize: 18, fontWeight: '500', margin: 0 }}>🔐 Anotações por cliente</h2>
                {clienteAnotacao && <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>{clienteAnotacao.nome}</p>}
              </div>
              <button onClick={() => { setModalAnotacoes(false); setClienteAnotacao(null); setAnotacoes([]) }} style={{ background: 'transparent', border: `1px solid ${t.borda}`, color: t.textoSuave, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {!clienteAnotacao ? (
                <>
                  <p style={{ color: t.textoSuave, fontSize: 14, marginBottom: 16 }}>Selecione um cliente:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {listaClientes.length === 0 ? (
                      <p style={{ color: t.textoFraco, fontSize: 13 }}>Nenhum cliente cadastrado.</p>
                    ) : listaClientes.map(c => (
                      <div key={c.id} onClick={() => { setClienteAnotacao(c); carregarAnotacoes(c.id) }} style={{ background: modo === 'dark' ? 'rgba(255,255,255,0.04)' : '#F4F6F9', border: `1px solid ${t.cardBorda}`, borderRadius: 10, padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: t.texto, fontWeight: '500', fontSize: 14 }}>{c.nome}</div>
                          <div style={{ color: t.textoFraco, fontSize: 12 }}>{c.telefone}</div>
                        </div>
                        <span style={{ color: t.textoFraco, fontSize: 18 }}>→</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => { setClienteAnotacao(null); setAnotacoes([]) }} style={{ background: 'transparent', border: 'none', color: t.textoFraco, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>← Voltar</button>

                  <div style={{ background: modo === 'dark' ? 'rgba(124,92,214,0.1)' : '#F5F0FF', border: `1px solid ${modo === 'dark' ? 'rgba(124,92,214,0.3)' : '#DDD5FF'}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                    <p style={{ color: t.textoSuave, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Nova anotação</p>
                    <input value={novaAnotacao.titulo} onChange={e => setNovaAnotacao({ ...novaAnotacao, titulo: e.target.value })} placeholder="Título (ex: Senha WiFi, NVR...)" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto, marginBottom: 10 }} />
                    <textarea value={novaAnotacao.conteudo} onChange={e => setNovaAnotacao({ ...novaAnotacao, conteudo: e.target.value })} placeholder="Conteúdo..." rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto, resize: 'vertical', fontFamily: 'sans-serif' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button onClick={salvarAnotacao} style={{ background: '#7C5CD6', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: '500' }}>💾 Salvar</button>
                    </div>
                  </div>

                  {anotacoes.length === 0 ? (
                    <div style={{ color: t.textoFraco, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Nenhuma anotação ainda.</div>
                  ) : anotacoes.map(a => (
                    <div key={a.id} style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                      <div onClick={() => setAnotacaoExpandida(anotacaoExpandida === a.id ? null : a.id)} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <div>
                          <div style={{ color: t.texto, fontWeight: '500', fontSize: 14 }}>🔑 {a.titulo}</div>
                          <div style={{ color: t.textoFraco, fontSize: 11, marginTop: 2 }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</div>
                        </div>
                        <span style={{ color: t.textoFraco, fontSize: 16, transform: anotacaoExpandida === a.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>⌄</span>
                      </div>
                      {anotacaoExpandida === a.id && (
                        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${t.cardBorda}` }}>
                          <pre style={{ color: t.textoSuave, fontSize: 13, margin: '12px 0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: modo === 'dark' ? 'rgba(255,255,255,0.04)' : '#F4F6F9', padding: 12, borderRadius: 8 }}>{a.conteudo || '(sem conteúdo)'}</pre>
                          <button onClick={() => excluirAnotacao(a.id)} style={{ background: 'transparent', color: cores.perigo, border: `1px solid ${cores.perigo}`, padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>🗑 Excluir</button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Dashboard
