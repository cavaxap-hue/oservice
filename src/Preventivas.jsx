import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { cores } from './theme'

const EQUIP_VAZIO = { identificacao: '', tipo: '', marca: '', modelo: '', numero_serie: '', local: '', ciclo_dias: 90 }
const PREV_VAZIA = { data_executada: '', o_que_foi_feito: '', tecnico: '', proxima_prevista: '' }

// Faixas de alerta por dias restantes até a próxima preventiva
const COR_VENCIDA = '#8B1E1E'
const COR_LARANJA = '#E07B24'

// Datas no formato 'YYYY-MM-DD' tratadas como data local (evita pular um dia por fuso)
function hojeISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function somarDias(iso, dias) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-').map(Number)
  const dt = new Date(a, m - 1, d + (parseInt(dias) || 0))
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function formatarData(iso) {
  if (!iso) return '—'
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

function diasAte(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  const [ha, hm, hd] = hojeISO().split('-').map(Number)
  return Math.round((new Date(a, m - 1, d) - new Date(ha, hm - 1, hd)) / (1000 * 60 * 60 * 24))
}

function Preventivas({ t, modo, empresaId }) {
  const [erro, setErro] = useState('')
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [clienteAberto, setClienteAberto] = useState(null)
  const [equipamentos, setEquipamentos] = useState([])
  const [historico, setHistorico] = useState([]) // preventivas do cliente aberto
  const [equipExpandido, setEquipExpandido] = useState(null) // id do equipamento aberto no accordion
  const [mostrarFormEquip, setMostrarFormEquip] = useState(false) // form de cadastro novo
  const [editandoEquip, setEditandoEquip] = useState(null) // id do equipamento em edição
  const [formEquip, setFormEquip] = useState(EQUIP_VAZIO)
  const [registrando, setRegistrando] = useState(null) // equipamento com o form de nova preventiva aberto
  const [formPrev, setFormPrev] = useState(PREV_VAZIA)
  const [editandoPrev, setEditandoPrev] = useState(null) // id da preventiva em edição no histórico
  const [formEditPrev, setFormEditPrev] = useState({ ...PREV_VAZIA, atualizarEquip: false })
  const [salvando, setSalvando] = useState(false)
  const [alertas, setAlertas] = useState([]) // equipamentos da empresa com proxima_preventiva definida
  const [alertaExpandido, setAlertaExpandido] = useState(null) // cliente_id expandido no painel
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900)

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 900) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    carregarClientes()
    carregarAlertas()
  }, [])

  // ===== CARREGAMENTO =====
  async function carregarClientes() {
    const { data, error } = await supabase.from('clientes').select('id, nome, telefone').eq('empresa_id', empresaId).order('nome', { ascending: true })
    if (error) { setErro('Erro ao carregar clientes: ' + error.message); return }
    if (data) setClientes(data)
  }

  async function carregarAlertas() {
    const { data } = await supabase.from('equipamentos_cliente').select('id, cliente_id, identificacao, tipo, proxima_preventiva').eq('empresa_id', empresaId).not('proxima_preventiva', 'is', null).order('proxima_preventiva', { ascending: true })
    setAlertas(data || [])
  }

  async function carregarEquipamentos(clienteId) {
    const { data: eq } = await supabase.from('equipamentos_cliente').select('*').eq('empresa_id', empresaId).eq('cliente_id', clienteId).order('identificacao', { ascending: true })
    const { data: prev } = await supabase.from('preventivas').select('*').eq('empresa_id', empresaId).eq('cliente_id', clienteId).order('data_executada', { ascending: false }).order('created_at', { ascending: false })
    setEquipamentos(eq || [])
    setHistorico(prev || [])
  }

  function recarregar() {
    carregarEquipamentos(clienteAberto.id)
    carregarAlertas()
  }

  function fecharFormularios() {
    setMostrarFormEquip(false)
    setEditandoEquip(null)
    setFormEquip(EQUIP_VAZIO)
    setRegistrando(null)
    setEditandoPrev(null)
  }

  function abrirCliente(c) {
    setClienteAberto(c)
    setEquipExpandido(null)
    fecharFormularios()
    carregarEquipamentos(c.id)
  }

  function voltarParaClientes() {
    setClienteAberto(null)
    setEquipExpandido(null)
    fecharFormularios()
  }

  function alternarEquip(id) {
    fecharFormularios()
    setEquipExpandido(equipExpandido === id ? null : id)
  }

  // ===== EQUIPAMENTO =====
  function novoEquipamento() {
    fecharFormularios()
    setMostrarFormEquip(true)
  }

  function abrirEdicaoEquip(eq) {
    fecharFormularios()
    setEditandoEquip(eq.id)
    setFormEquip({
      identificacao: eq.identificacao || '',
      tipo: eq.tipo || '',
      marca: eq.marca || '',
      modelo: eq.modelo || '',
      numero_serie: eq.numero_serie || '',
      local: eq.local || '',
      ciclo_dias: eq.ciclo_dias || 90,
    })
  }

  async function salvarEquipamento() {
    if (!formEquip.identificacao.trim()) { window.alert('Informe a identificação do equipamento.'); return }
    setSalvando(true)
    const dados = { ...formEquip, identificacao: formEquip.identificacao.trim(), ciclo_dias: parseInt(formEquip.ciclo_dias) || 90 }
    const { error } = editandoEquip
      ? await supabase.from('equipamentos_cliente').update(dados).eq('id', editandoEquip).eq('empresa_id', empresaId)
      : await supabase.from('equipamentos_cliente').insert([{ ...dados, empresa_id: empresaId, cliente_id: clienteAberto.id, ativo: true }])
    setSalvando(false)
    if (error) { window.alert('Erro ao salvar equipamento: ' + error.message); return }
    fecharFormularios()
    recarregar()
  }

  async function excluirEquipamento(eq) {
    if (!window.confirm(`Excluir o equipamento "${eq.identificacao}" e todo o histórico de preventivas dele?`)) return
    await supabase.from('preventivas').delete().eq('equipamento_id', eq.id).eq('empresa_id', empresaId)
    const { error } = await supabase.from('equipamentos_cliente').delete().eq('id', eq.id).eq('empresa_id', empresaId)
    if (error) window.alert('Erro ao excluir equipamento: ' + error.message)
    fecharFormularios()
    setEquipExpandido(null)
    recarregar()
  }

  // ===== NOVA PREVENTIVA =====
  function abrirRegistro(eq) {
    const hoje = hojeISO()
    fecharFormularios()
    setRegistrando(eq)
    setFormPrev({ data_executada: hoje, o_que_foi_feito: '', tecnico: '', proxima_prevista: somarDias(hoje, eq.ciclo_dias) })
  }

  // Ao mudar a data executada, sugere de novo a próxima (o usuário ainda pode editar depois)
  function mudarDataExecutada(valor) {
    setFormPrev({ ...formPrev, data_executada: valor, proxima_prevista: somarDias(valor, registrando.ciclo_dias) })
  }

  async function salvarPreventiva() {
    if (!formPrev.data_executada) { window.alert('Informe a data executada.'); return }
    if (!formPrev.o_que_foi_feito.trim()) { window.alert('Descreva o que foi feito.'); return }
    setSalvando(true)
    const proxima = formPrev.proxima_prevista || null
    const { error } = await supabase.from('preventivas').insert([{
      empresa_id: empresaId,
      equipamento_id: registrando.id,
      cliente_id: clienteAberto.id,
      data_executada: formPrev.data_executada,
      o_que_foi_feito: formPrev.o_que_foi_feito.trim(),
      tecnico: formPrev.tecnico.trim(),
      proxima_prevista: proxima,
    }])
    if (error) { setSalvando(false); window.alert('Erro ao registrar preventiva: ' + error.message); return }
    const { error: errEq } = await supabase.from('equipamentos_cliente').update({ proxima_preventiva: proxima }).eq('id', registrando.id).eq('empresa_id', empresaId)
    setSalvando(false)
    if (errEq) window.alert('Preventiva registrada, mas não foi possível atualizar a próxima data do equipamento: ' + errEq.message)
    setRegistrando(null)
    recarregar()
  }

  // ===== EDITAR / EXCLUIR PREVENTIVA DO HISTÓRICO =====
  function abrirEdicaoPrev(p) {
    fecharFormularios()
    setEditandoPrev(p.id)
    setFormEditPrev({
      data_executada: p.data_executada || '',
      o_que_foi_feito: p.o_que_foi_feito || '',
      tecnico: p.tecnico || '',
      proxima_prevista: p.proxima_prevista || '',
      atualizarEquip: false,
    })
  }

  // Editar uma preventiva NÃO mexe na próxima data do equipamento, a não ser que o usuário
  // marque explicitamente a opção (só oferecida na preventiva mais recente)
  async function salvarEdicaoPrev(eq) {
    if (!formEditPrev.data_executada) { window.alert('Informe a data executada.'); return }
    if (!formEditPrev.o_que_foi_feito.trim()) { window.alert('Descreva o que foi feito.'); return }
    setSalvando(true)
    const proxima = formEditPrev.proxima_prevista || null
    const { error } = await supabase.from('preventivas').update({
      data_executada: formEditPrev.data_executada,
      o_que_foi_feito: formEditPrev.o_que_foi_feito.trim(),
      tecnico: formEditPrev.tecnico.trim(),
      proxima_prevista: proxima,
    }).eq('id', editandoPrev).eq('empresa_id', empresaId)
    if (error) { setSalvando(false); window.alert('Erro ao salvar preventiva: ' + error.message); return }
    if (formEditPrev.atualizarEquip) {
      const { error: errEq } = await supabase.from('equipamentos_cliente').update({ proxima_preventiva: proxima }).eq('id', eq.id).eq('empresa_id', empresaId)
      if (errEq) window.alert('Preventiva salva, mas não foi possível atualizar a próxima data do equipamento: ' + errEq.message)
    }
    setSalvando(false)
    setEditandoPrev(null)
    recarregar()
  }

  async function excluirPreventiva(p) {
    if (!window.confirm(`Excluir a preventiva de ${formatarData(p.data_executada)}?`)) return
    const { error } = await supabase.from('preventivas').delete().eq('id', p.id).eq('empresa_id', empresaId)
    if (error) { window.alert('Erro ao excluir preventiva: ' + error.message); return }
    if (editandoPrev === p.id) setEditandoPrev(null)
    recarregar()
  }

  // ===== STATUS / ALERTAS =====
  // Cor e texto conforme os dias restantes até a próxima preventiva
  function infoProxima(iso) {
    if (!iso) return { cor: t.textoFraco, texto: 'Sem data prevista' }
    const dias = diasAte(iso)
    let cor
    if (dias < 0) cor = COR_VENCIDA
    else if (dias <= 7) cor = cores.perigo
    else if (dias <= 15) cor = COR_LARANJA
    else if (dias <= 21) cor = cores.aguardando
    else cor = cores.sucesso
    let texto
    if (dias < 0) texto = `Vencida há ${-dias} dia${dias === -1 ? '' : 's'}`
    else if (dias === 0) texto = 'Vence hoje'
    else texto = `Faltam ${dias} dia${dias === 1 ? '' : 's'}`
    return { cor, texto }
  }

  // Painel de alertas: agrupa por cliente; o cliente com a data mais próxima/vencida vai pro topo
  // (alertas já vêm ordenados por proxima_preventiva asc, então a ordem se mantém dentro de cada grupo)
  const gruposAlerta = (() => {
    const mapa = {}
    alertas.forEach(eq => {
      if (!mapa[eq.cliente_id]) {
        const c = clientes.find(x => x.id === eq.cliente_id)
        mapa[eq.cliente_id] = { cliente_id: eq.cliente_id, nome: c ? c.nome : 'Cliente', equipamentos: [] }
      }
      mapa[eq.cliente_id].equipamentos.push(eq)
    })
    return Object.values(mapa).sort((a, b) => a.equipamentos[0].proxima_preventiva.localeCompare(b.equipamentos[0].proxima_preventiva))
  })()

  function clicarAlerta(g) {
    setAlertaExpandido(alertaExpandido === g.cliente_id ? null : g.cliente_id)
    const c = clientes.find(x => x.id === g.cliente_id)
    if (c && clienteAberto?.id !== c.id) abrirCliente(c)
  }

  function clicarEquipAlerta(eq) {
    fecharFormularios()
    setEquipExpandido(eq.id)
  }

  const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))

  // ===== ESTILOS =====
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none',
    boxSizing: 'border-box', background: t.inputBg, color: t.texto,
  }
  const dataStyle = { ...inputStyle, colorScheme: modo === 'dark' ? 'dark' : 'light' }
  const labelStyle = { fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6, textAlign: 'left' }
  const secaoStyle = { fontSize: 11, fontWeight: '500', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }
  const subBoxStyle = { background: modo === 'dark' ? 'rgba(255,255,255,0.03)' : '#F9FAFB', border: `1px solid ${t.cardBorda}`, borderRadius: 10, padding: 14, marginTop: 14 }
  const btnSecundario = { background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }
  const btnPerigo = { background: 'transparent', color: cores.perigo, border: `1px solid ${cores.perigo}`, padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }
  const btnSalvar = { background: salvando ? t.textoFraco : cores.pronto, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: '500' }

  const camposEquip = [
    { campo: 'identificacao', label: 'Identificação', placeholder: 'Ex: Ar-condicionado sala 2' },
    { campo: 'tipo', label: 'Tipo', placeholder: 'Ex: Nobreak, Servidor, Ar-condicionado' },
    { campo: 'marca', label: 'Marca', placeholder: 'Ex: SMS' },
    { campo: 'modelo', label: 'Modelo', placeholder: 'Ex: Station II 1400VA' },
    { campo: 'numero_serie', label: 'Número de série', placeholder: 'S/N' },
    { campo: 'local', label: 'Local', placeholder: 'Ex: Recepção, Rack do 1º andar' },
  ]

  // ===== BLOCOS DE JSX =====

  // Mesmo formulário para cadastrar e editar equipamento
  function formularioEquipamento() {
    return (
      <div>
        <p style={secaoStyle}>{editandoEquip ? 'Editar equipamento' : 'Cadastrar equipamento'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {camposEquip.map(f => (
            <div key={f.campo}>
              <label style={labelStyle}>{f.label}</label>
              <input value={formEquip[f.campo]} onChange={e => setFormEquip({ ...formEquip, [f.campo]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Ciclo (dias)</label>
            <input value={formEquip.ciclo_dias} onChange={e => setFormEquip({ ...formEquip, ciclo_dias: e.target.value })} type="number" min="1" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={fecharFormularios} style={btnSecundario}>Cancelar</button>
          <button onClick={salvarEquipamento} disabled={salvando} style={btnSalvar}>{salvando ? 'Salvando...' : (editandoEquip ? 'Salvar alterações' : 'Salvar equipamento')}</button>
        </div>
      </div>
    )
  }

  // Dados completos do equipamento + destaque da próxima preventiva
  function dadosEquipamento(eq, prox) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, color: t.textoFraco, fontSize: 12, lineHeight: 1.7 }}>
            {eq.tipo && <div>Tipo: <span style={{ color: t.textoSuave }}>{eq.tipo}</span></div>}
            {(eq.marca || eq.modelo) && <div>Marca/Modelo: <span style={{ color: t.textoSuave }}>{[eq.marca, eq.modelo].filter(Boolean).join(' ')}</span></div>}
            {eq.numero_serie && <div>S/N: <span style={{ color: t.textoSuave }}>{eq.numero_serie}</span></div>}
            {eq.local && <div>📍 Local: <span style={{ color: t.textoSuave }}>{eq.local}</span></div>}
            <div>Ciclo: <span style={{ color: t.textoSuave }}>{eq.ciclo_dias} dias</span></div>
          </div>
          <button onClick={() => abrirEdicaoEquip(eq)} title="Editar equipamento" style={{ ...btnSecundario, padding: '6px 10px', fontSize: 12 }}>✏️ Editar</button>
          <button onClick={() => excluirEquipamento(eq)} title="Excluir equipamento" style={btnPerigo}>🗑 Excluir</button>
        </div>
        <div style={{ background: prox.cor + '1F', borderRadius: 8, padding: '10px 14px', marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em' }}>PRÓXIMA PREVENTIVA</div>
            <div style={{ color: prox.cor, fontSize: 18, fontWeight: '600', marginTop: 2 }}>📅 {formatarData(eq.proxima_preventiva)}</div>
          </div>
          <span style={{ color: prox.cor, fontSize: 12, fontWeight: '500', textAlign: 'right' }}>{prox.texto}</span>
        </div>
      </div>
    )
  }

  // Formulário de nova preventiva (ou o botão que abre ele)
  function registroPreventiva(eq) {
    if (registrando?.id !== eq.id) {
      return (
        <button onClick={() => abrirRegistro(eq)} style={{ background: t.azul, color: '#fff', border: 'none', padding: '11px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: '500', marginTop: 14, width: '100%' }}>🛡️ Registrar preventiva</button>
      )
    }
    return (
      <div style={subBoxStyle}>
        <p style={secaoStyle}>Registrar preventiva</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Data executada</label>
            <input value={formPrev.data_executada} onChange={e => mudarDataExecutada(e.target.value)} type="date" style={dataStyle} />
          </div>
          <div>
            <label style={labelStyle}>Técnico</label>
            <input value={formPrev.tecnico} onChange={e => setFormPrev({ ...formPrev, tecnico: e.target.value })} placeholder="Nome do técnico" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>O que foi feito</label>
          <textarea value={formPrev.o_que_foi_feito} onChange={e => setFormPrev({ ...formPrev, o_que_foi_feito: e.target.value })} placeholder="Descreva o serviço: limpeza, troca de filtros, teste de baterias, medições, peças substituídas, observações..." rows={8} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Próxima prevista <span style={{ color: t.textoFraco, fontSize: 11 }}>(sugerida: data executada + {eq.ciclo_dias} dias — pode alterar)</span></label>
          <input value={formPrev.proxima_prevista} onChange={e => setFormPrev({ ...formPrev, proxima_prevista: e.target.value })} type="date" style={{ ...dataStyle, maxWidth: 220 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setRegistrando(null)} style={btnSecundario}>Cancelar</button>
          <button onClick={salvarPreventiva} disabled={salvando} style={btnSalvar}>{salvando ? 'Salvando...' : '💾 Salvar preventiva'}</button>
        </div>
      </div>
    )
  }

  // Formulário de edição de uma preventiva do histórico
  function edicaoPreventiva(eq, maisRecente) {
    return (
      <div style={{ ...subBoxStyle, marginTop: 8, marginBottom: 8 }}>
        <p style={secaoStyle}>Editar preventiva</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Data executada</label>
            <input value={formEditPrev.data_executada} onChange={e => setFormEditPrev({ ...formEditPrev, data_executada: e.target.value })} type="date" style={dataStyle} />
          </div>
          <div>
            <label style={labelStyle}>Técnico</label>
            <input value={formEditPrev.tecnico} onChange={e => setFormEditPrev({ ...formEditPrev, tecnico: e.target.value })} placeholder="Nome do técnico" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>O que foi feito</label>
          <textarea value={formEditPrev.o_que_foi_feito} onChange={e => setFormEditPrev({ ...formEditPrev, o_que_foi_feito: e.target.value })} rows={8} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Próxima prevista</label>
          <input value={formEditPrev.proxima_prevista} onChange={e => setFormEditPrev({ ...formEditPrev, proxima_prevista: e.target.value })} type="date" style={{ ...dataStyle, maxWidth: 220 }} />
        </div>
        {maisRecente && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: t.textoSuave, fontSize: 12, marginBottom: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={formEditPrev.atualizarEquip} onChange={e => setFormEditPrev({ ...formEditPrev, atualizarEquip: e.target.checked })} style={{ marginTop: 2 }} />
            <span>Atualizar também a próxima preventiva do equipamento para esta data <span style={{ color: t.textoFraco }}>(atual: {formatarData(eq.proxima_preventiva)})</span></span>
          </label>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setEditandoPrev(null)} style={btnSecundario}>Cancelar</button>
          <button onClick={() => salvarEdicaoPrev(eq)} disabled={salvando} style={btnSalvar}>{salvando ? 'Salvando...' : '💾 Salvar alterações'}</button>
        </div>
      </div>
    )
  }

  // Um item do histórico (visualização)
  function itemHistorico(p) {
    return (
      <div style={{ borderTop: `1px solid ${t.cardBorda}`, padding: '10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: t.texto, fontSize: 13, fontWeight: '500' }}>✅ {formatarData(p.data_executada)}</span>
          {p.tecnico && <span style={{ color: t.textoFraco, fontSize: 12 }}>🔧 {p.tecnico}</span>}
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={() => abrirEdicaoPrev(p)} title="Editar preventiva" style={{ ...btnSecundario, padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>✏️ Editar</button>
            <button onClick={() => excluirPreventiva(p)} title="Excluir preventiva" style={{ ...btnPerigo, padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>🗑 Excluir</button>
          </span>
        </div>
        {p.o_que_foi_feito && <div style={{ color: t.textoSuave, fontSize: 13, marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word' }}>{p.o_que_foi_feito}</div>}
        {p.proxima_prevista && <div style={{ color: t.textoFraco, fontSize: 11, marginTop: 4 }}>Próxima prevista: {formatarData(p.proxima_prevista)}</div>}
      </div>
    )
  }

  // Histórico completo de um equipamento (mais recente primeiro)
  function historicoEquipamento(eq, hist) {
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ color: t.textoSuave, fontSize: 13, fontWeight: '500', marginBottom: 8 }}>Histórico de preventivas ({hist.length})</div>
        {hist.length === 0 && <div style={{ color: t.textoFraco, fontSize: 12 }}>Nenhuma preventiva registrada.</div>}
        {hist.map((p, i) => (
          <div key={p.id}>
            {editandoPrev === p.id ? edicaoPreventiva(eq, i === 0) : itemHistorico(p)}
          </div>
        ))}
      </div>
    )
  }

  // Conteúdo do card quando expandido
  function detalhesEquipamento(eq, prox, hist) {
    if (editandoEquip === eq.id) return formularioEquipamento()
    return (
      <div>
        {dadosEquipamento(eq, prox)}
        {registroPreventiva(eq)}
        {historicoEquipamento(eq, hist)}
      </div>
    )
  }

  // Card de equipamento na grade: bloco compacto; ao expandir ocupa a linha inteira da grade
  function cardEquipamento(eq) {
    const prox = infoProxima(eq.proxima_preventiva)
    const hist = historico.filter(p => p.equipamento_id === eq.id)
    const resumo = [eq.tipo, [eq.marca, eq.modelo].filter(Boolean).join(' ')].filter(Boolean).join(' — ')
    const expandido = equipExpandido === eq.id
    const seta = <span style={{ color: t.textoFraco, fontSize: 18, lineHeight: 1, flexShrink: 0, transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>⌄</span>
    return (
      <div key={eq.id} style={{ gridColumn: expandido ? '1 / -1' : 'auto', background: t.card, borderRadius: 12, border: `1px solid ${expandido ? prox.cor : t.cardBorda}`, overflow: 'hidden', transition: 'border-color 0.2s', boxShadow: modo === 'dark' ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ height: 4, background: prox.cor }}></div>
        <div onClick={() => alternarEquip(eq.id)} style={{ display: 'flex', flexDirection: expandido ? 'row' : 'column', alignItems: expandido ? 'center' : 'stretch', gap: expandido ? 12 : 8, padding: '12px 14px', cursor: 'pointer', minHeight: expandido ? 'auto' : 116, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: expandido ? 1 : 'none', minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: t.texto, fontWeight: '600', fontSize: 14, wordBreak: 'break-word' }}>{eq.identificacao}</div>
              {resumo && <div style={{ color: t.textoSuave, fontSize: 12, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumo}</div>}
            </div>
            {!expandido && seta}
          </div>
          <div style={{ marginTop: expandido ? 0 : 'auto', textAlign: expandido ? 'right' : 'left', flexShrink: 0 }}>
            <div style={{ color: prox.cor, fontSize: 13, fontWeight: '600' }}>📅 {formatarData(eq.proxima_preventiva)}</div>
            <div style={{ color: prox.cor, fontSize: 11, marginTop: 2 }}>{prox.texto}</div>
          </div>
          {expandido && seta}
        </div>
        {expandido && (
          <div style={{ borderTop: `1px solid ${t.cardBorda}`, padding: 16 }}>
            {detalhesEquipamento(eq, prox, hist)}
          </div>
        )}
      </div>
    )
  }

  // ===== COLUNA ESQUERDA: lista de clientes =====
  function listaClientes() {
    return (
      <div>
        <div style={{ marginBottom: 18 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..." style={{ ...inputStyle, maxWidth: 280 }} />
        </div>
        {clientesFiltrados.length === 0 && <p style={{ color: t.textoFraco, fontSize: 14 }}>Nenhum cliente encontrado.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
          {clientesFiltrados.map(c => (
            <div key={c.id} onClick={() => abrirCliente(c)} style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, cursor: 'pointer', boxShadow: modo === 'dark' ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
              <div style={{ color: t.texto, fontWeight: '500', fontSize: 14, wordBreak: 'break-word' }}>{c.nome}</div>
              {c.telefone && <div style={{ color: t.textoFraco, fontSize: 12, marginTop: 2 }}>{c.telefone}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ===== COLUNA ESQUERDA: equipamentos do cliente aberto =====
  function equipamentosDoCliente() {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <button onClick={voltarParaClientes} style={btnSecundario}>← Voltar</button>
          <span style={{ color: t.texto, fontSize: 16, fontWeight: '500' }}>👤 {clienteAberto.nome}</span>
          <button onClick={novoEquipamento} style={{ background: t.azul, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: '500', marginLeft: 'auto' }}>+ Novo equipamento</button>
        </div>

        {mostrarFormEquip && (
          <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
            {formularioEquipamento()}
          </div>
        )}

        {equipamentos.length === 0 && !mostrarFormEquip && (
          <p style={{ color: t.textoFraco, fontSize: 13 }}>Nenhum equipamento cadastrado para este cliente.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, alignItems: 'start' }}>
          {equipamentos.map(eq => cardEquipamento(eq))}
        </div>
      </div>
    )
  }

  // ===== COLUNA DIREITA: painel de alertas =====
  const legenda = [
    { cor: COR_VENCIDA, label: 'Vencida' },
    { cor: cores.perigo, label: '0–7 dias' },
    { cor: COR_LARANJA, label: '8–15 dias' },
    { cor: cores.aguardando, label: '16–21 dias' },
    { cor: cores.sucesso, label: '+21 dias' },
  ]

  function grupoAlerta(g) {
    const pior = infoProxima(g.equipamentos[0].proxima_preventiva)
    const expandido = alertaExpandido === g.cliente_id
    const selecionado = clienteAberto?.id === g.cliente_id
    return (
      <div key={g.cliente_id} style={{ gridColumn: expandido ? '1 / -1' : 'auto', border: `1px solid ${selecionado || expandido ? pior.cor : t.cardBorda}`, borderRadius: 10, overflow: 'hidden', background: pior.cor + '14' }}>
        <div style={{ height: 4, background: pior.cor }}></div>
        <div onClick={() => clicarAlerta(g)} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', cursor: 'pointer', minHeight: expandido ? 'auto' : 96, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ flex: 1, minWidth: 0, color: t.texto, fontSize: 13, fontWeight: '600', wordBreak: 'break-word' }}>{g.nome}</div>
            <span style={{ color: t.textoFraco, fontSize: 16, lineHeight: 1, flexShrink: 0, transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>⌄</span>
          </div>
          <div style={{ color: t.textoFraco, fontSize: 11 }}>{g.equipamentos.length} equipamento{g.equipamentos.length === 1 ? '' : 's'}</div>
          <span style={{ marginTop: 'auto', alignSelf: 'flex-start', background: pior.cor + '26', color: pior.cor, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: '600' }}>{pior.texto}</span>
        </div>
        {expandido && (
          <div style={{ padding: '0 12px 8px', background: t.card }}>
            {g.equipamentos.map(eq => {
              const info = infoProxima(eq.proxima_preventiva)
              return (
                <div key={eq.id} onClick={() => clicarEquipAlerta(eq)} title="Ver equipamento" style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${t.cardBorda}`, padding: '8px 0', cursor: 'pointer' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: info.cor, flexShrink: 0 }}></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: t.textoSuave, fontSize: 13, wordBreak: 'break-word' }}>{eq.identificacao}</div>
                    {eq.tipo && <div style={{ color: t.textoFraco, fontSize: 11 }}>{eq.tipo}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: t.texto, fontSize: 13 }}>{formatarData(eq.proxima_preventiva)}</div>
                    <div style={{ color: info.cor, fontSize: 11, fontWeight: '500' }}>{info.texto}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function painelAlertas() {
    return (
      <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, boxShadow: modo === 'dark' ? '0 2px 10px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>🔔 Alertas de preventiva</div>
        <div style={{ color: t.textoFraco, fontSize: 12, marginBottom: 12 }}>Clientes ordenados pela preventiva mais próxima</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {legenda.map(l => (
            <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: t.textoFraco, fontSize: 11 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: l.cor }}></span>{l.label}
            </span>
          ))}
        </div>
        {gruposAlerta.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: t.textoFraco, fontSize: 13 }}>Nenhuma preventiva programada ainda.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, alignItems: 'start' }}>
          {gruposAlerta.map(g => grupoAlerta(g))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>🛡️ Preventivas</h1>
        <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>Equipamentos dos clientes e manutenções preventivas programadas</p>
      </div>

      {erro && <p style={{ color: cores.perigo, fontSize: 13, marginBottom: 16 }}>{erro}</p>}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: isMobile ? 'none' : '0 0 56%', width: isMobile ? '100%' : 'auto', minWidth: 0 }}>
          {clienteAberto ? equipamentosDoCliente() : listaClientes()}
        </div>
        <div style={{ flex: 1, width: isMobile ? '100%' : 'auto', minWidth: 0, position: isMobile ? 'static' : 'sticky', top: 16, maxHeight: isMobile ? 'none' : 'calc(100vh - 32px)', overflowY: isMobile ? 'visible' : 'auto' }}>
          {painelAlertas()}
        </div>
      </div>
    </div>
  )
}

export default Preventivas
