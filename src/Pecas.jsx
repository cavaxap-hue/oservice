import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { cores } from './theme'
import { numero, dinheiro, mensagemErroEstoque } from './estoqueUtil'

const PECA_VAZIA = { nome: '', codigo: '', preco_custo: '', preco_venda: '', estoque_minimo: '', quantidade_inicial: '' }

function Pecas({ t, modo, empresaId }) {
  const [pecas, setPecas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [mostrarInativas, setMostrarInativas] = useState(false)
  const [acao, setAcao] = useState(null) // { tipo: 'nova' | 'editar' | 'entrada' | 'ajuste', peca }
  const [form, setForm] = useState(PECA_VAZIA)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarPecas()
  }, [])

  async function carregarPecas() {
    const { data, error } = await supabase.from('pecas').select('*').eq('empresa_id', empresaId).order('nome', { ascending: true })
    if (error) console.error('Erro ao carregar peças:', error)
    if (data) setPecas(data)
    setCarregando(false)
  }

  function abrir(tipo, peca = null) {
    setErro('')
    if (tipo === 'nova') setForm(PECA_VAZIA)
    if (tipo === 'editar') setForm({
      nome: peca.nome || '',
      codigo: peca.codigo || '',
      preco_custo: peca.preco_custo ?? '',
      preco_venda: peca.preco_venda ?? '',
      estoque_minimo: peca.estoque_minimo ?? '',
    })
    if (tipo === 'entrada') setForm({ quantidade: '', custo: peca.preco_custo ?? '', observacao: '' })
    if (tipo === 'ajuste') setForm({ nova_quantidade: String(Number(peca.quantidade) || 0), motivo: '' })
    setAcao({ tipo, peca })
  }

  function fechar() {
    setAcao(null)
    setErro('')
  }

  function valorOuZero(v) {
    const n = numero(v)
    return Number.isNaN(n) ? 0 : n
  }

  async function salvarPeca() {
    if (!form.nome.trim()) { setErro('Informe o nome da peça.'); return }
    const custo = valorOuZero(form.preco_custo)
    const venda = valorOuZero(form.preco_venda)
    const minimo = valorOuZero(form.estoque_minimo)
    if (custo < 0 || venda < 0 || minimo < 0) { setErro('Valores não podem ser negativos.'); return }
    const dados = { nome: form.nome.trim(), codigo: form.codigo.trim() || null, preco_custo: custo, preco_venda: venda, estoque_minimo: minimo }

    setSalvando(true)
    setErro('')
    if (acao.tipo === 'editar') {
      // A quantidade só muda por entrada, ajuste ou OS
      const { error } = await supabase.from('pecas').update(dados).eq('id', acao.peca.id).eq('empresa_id', empresaId)
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }
    } else {
      const inicial = valorOuZero(form.quantidade_inicial)
      if (inicial < 0 || !Number.isInteger(inicial)) { setErro('Quantidade inicial inválida.'); setSalvando(false); return }
      const { data, error } = await supabase.from('pecas').insert([{ ...dados, quantidade: 0, ativo: true, empresa_id: empresaId }]).select('id').single()
      if (error) { setErro('Erro ao salvar. Tente novamente.'); setSalvando(false); return }
      // Estoque inicial entra como movimento, para aparecer no histórico
      if (inicial > 0) {
        const { error: errEntrada } = await supabase.rpc('estoque_entrada', { p_peca: data.id, p_quantidade: inicial, p_custo: custo || null, p_obs: 'Estoque inicial' })
        if (errEntrada) {
          setErro(`Peça cadastrada, mas a entrada inicial falhou: ${await mensagemErroEstoque(errEntrada, data.id, empresaId)}`)
          setSalvando(false)
          carregarPecas()
          return
        }
      }
    }
    setSalvando(false)
    fechar()
    carregarPecas()
  }

  async function registrarEntrada() {
    const quantidade = numero(form.quantidade)
    if (!Number.isInteger(quantidade) || quantidade <= 0) { setErro('Informe uma quantidade inteira maior que zero.'); return }
    const custo = numero(form.custo)
    if (!Number.isNaN(custo) && custo < 0) { setErro('Custo não pode ser negativo.'); return }
    setSalvando(true)
    setErro('')
    const { error } = await supabase.rpc('estoque_entrada', {
      p_peca: acao.peca.id,
      p_quantidade: quantidade,
      p_custo: Number.isNaN(custo) ? null : custo,
      p_obs: form.observacao.trim() || null,
    })
    setSalvando(false)
    if (error) { setErro(await mensagemErroEstoque(error, acao.peca.id, empresaId)); return }
    fechar()
    carregarPecas()
  }

  async function registrarAjuste() {
    const nova = numero(form.nova_quantidade)
    if (!Number.isInteger(nova) || nova < 0) { setErro('Informe uma quantidade inteira (zero ou mais).'); return }
    if (!form.motivo.trim()) { setErro('Informe o motivo do ajuste.'); return }
    setSalvando(true)
    setErro('')
    const { error } = await supabase.rpc('estoque_ajuste', { p_peca: acao.peca.id, p_nova_quantidade: nova, p_obs: form.motivo.trim() })
    setSalvando(false)
    if (error) { setErro(await mensagemErroEstoque(error, acao.peca.id, empresaId)); return }
    fechar()
    carregarPecas()
  }

  async function alternarAtivo(peca) {
    if (peca.ativo && !window.confirm(`Desativar "${peca.nome}"? Ela some das buscas da OS, mas continua no histórico.`)) return
    const { error } = await supabase.from('pecas').update({ ativo: !peca.ativo }).eq('id', peca.id).eq('empresa_id', empresaId)
    if (error) { window.alert('Erro ao salvar. Tente novamente.'); return }
    carregarPecas()
  }

  const termo = busca.trim().toLowerCase()
  const pecasFiltradas = pecas.filter(p =>
    (mostrarInativas || p.ativo) &&
    (!termo || (p.nome || '').toLowerCase().includes(termo) || (p.codigo || '').toLowerCase().includes(termo))
  )

  const inputStyle = { width: '100%', padding: '11px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto }
  const labelStyle = { fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6, textAlign: 'left' }
  const thStyle = { padding: '10px 12px', textAlign: 'left', color: t.textoFraco, fontWeight: '500', fontSize: 12, whiteSpace: 'nowrap' }
  const botaoPequeno = (cor) => ({ background: 'transparent', color: cor, border: `1px solid ${cor}`, padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' })

  function campo(chave, rotulo, props = {}) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{rotulo}</label>
        <input value={form[chave] ?? ''} onChange={e => setForm({ ...form, [chave]: e.target.value })} style={inputStyle} {...props} />
      </div>
    )
  }

  const titulos = { nova: 'Nova peça', editar: 'Editar peça', entrada: 'Entrada de estoque', ajuste: 'Ajustar estoque' }
  const acoesSalvar = { nova: salvarPeca, editar: salvarPeca, entrada: registrarEntrada, ajuste: registrarAjuste }

  if (carregando) return <div style={{ color: t.textoFraco, padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>Peças</h1>
          <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>Cadastro de peças com custo, venda e quantidade em estoque</p>
        </div>
        <button onClick={() => abrir('nova')} style={{ background: t.azul, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: '500' }}>+ Nova peça</button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou código..." style={{ ...inputStyle, flex: '1 1 260px', width: 'auto' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.textoSuave, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={mostrarInativas} onChange={e => setMostrarInativas(e.target.checked)} />
          Mostrar inativas
        </label>
      </div>

      <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, overflowX: 'auto' }}>
        {pecasFiltradas.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: t.textoFraco, fontSize: 14 }}>
            {termo ? 'Nenhuma peça encontrada.' : 'Nenhuma peça cadastrada ainda. Clique em + Nova peça para começar.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 720 }}>
            <thead>
              <tr>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>Código</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Custo</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Venda</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Qtd.</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pecasFiltradas.map(p => {
                const baixo = p.ativo && Number(p.quantidade) <= Number(p.estoque_minimo || 0)
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${t.cardBorda}`, opacity: p.ativo ? 1 : 0.55, background: baixo ? (modo === 'dark' ? 'rgba(226,75,74,0.08)' : '#FDF0F0') : 'transparent' }}>
                    <td style={{ padding: '10px 12px', color: t.texto, fontWeight: '500' }}>
                      {p.nome}
                      {!p.ativo && <span style={{ marginLeft: 8, fontSize: 11, color: t.textoFraco, border: `1px solid ${t.borda}`, borderRadius: 10, padding: '1px 7px' }}>inativa</span>}
                    </td>
                    <td style={{ padding: '10px 12px', color: t.textoSuave, fontFamily: 'monospace', fontSize: 13 }}>{p.codigo || '—'}</td>
                    <td style={{ padding: '10px 12px', color: t.textoSuave, textAlign: 'right', whiteSpace: 'nowrap' }}>{dinheiro(p.preco_custo)}</td>
                    <td style={{ padding: '10px 12px', color: t.texto, textAlign: 'right', whiteSpace: 'nowrap' }}>{dinheiro(p.preco_venda)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ color: baixo ? cores.perigo : t.texto, fontWeight: baixo ? '600' : '500' }} title={baixo ? `Mínimo: ${Number(p.estoque_minimo) || 0}` : undefined}>
                        {baixo && '⚠ '}{Number(p.quantidade) || 0}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {p.ativo && <button onClick={() => abrir('entrada', p)} style={botaoPequeno(cores.pronto)}>+ Entrada</button>}
                        {p.ativo && <button onClick={() => abrir('ajuste', p)} style={botaoPequeno(cores.aguardando)}>Ajustar</button>}
                        <button onClick={() => abrir('editar', p)} style={botaoPequeno(t.azul)}>✏ Editar</button>
                        <button onClick={() => alternarAtivo(p)} style={botaoPequeno(p.ativo ? cores.perigo : cores.pronto)}>{p.ativo ? 'Desativar' : 'Reativar'}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {acao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.cardBorda}`, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h2 style={{ color: t.texto, fontSize: 18, fontWeight: '500', margin: 0 }}>{titulos[acao.tipo]}</h2>
                {acao.peca && acao.tipo !== 'editar' && (
                  <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>{acao.peca.nome} · em estoque: {Number(acao.peca.quantidade) || 0}</p>
                )}
              </div>
              <button onClick={fechar} style={{ background: 'transparent', border: `1px solid ${t.borda}`, color: t.textoSuave, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {(acao.tipo === 'nova' || acao.tipo === 'editar') && (
              <>
                {campo('nome', 'Nome', { placeholder: 'Ex: SSD 240GB Kingston' })}
                {campo('codigo', 'Código (opcional)', { placeholder: 'Ex: SSD240' })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {campo('preco_custo', 'Preço de custo (R$)', { type: 'number', min: 0, step: '0.01', placeholder: '0,00' })}
                  {campo('preco_venda', 'Preço de venda (R$)', { type: 'number', min: 0, step: '0.01', placeholder: '0,00' })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {campo('estoque_minimo', 'Estoque mínimo', { type: 'number', min: 0, step: '1', placeholder: '0' })}
                  {acao.tipo === 'nova' && campo('quantidade_inicial', 'Quantidade inicial', { type: 'number', min: 0, step: '1', placeholder: '0' })}
                </div>
                {acao.tipo === 'editar' && (
                  <p style={{ color: t.textoFraco, fontSize: 12, margin: '0 0 14px' }}>Para mudar a quantidade, use “Entrada” ou “Ajustar”.</p>
                )}
              </>
            )}

            {acao.tipo === 'entrada' && (
              <>
                {campo('quantidade', 'Quantidade que entrou', { type: 'number', min: 1, step: '1', placeholder: 'Ex: 5', autoFocus: true })}
                {campo('custo', 'Custo unitário (R$, opcional)', { type: 'number', min: 0, step: '0.01', placeholder: '0,00' })}
                {campo('observacao', 'Observação (opcional)', { placeholder: 'Ex: NF 1234, fornecedor X' })}
              </>
            )}

            {acao.tipo === 'ajuste' && (
              <>
                {campo('nova_quantidade', 'Nova quantidade', { type: 'number', min: 0, step: '1', autoFocus: true })}
                {campo('motivo', 'Motivo (obrigatório)', { placeholder: 'Ex: contagem de inventário, peça com defeito' })}
              </>
            )}

            {erro && <p style={{ color: cores.perigo, fontSize: 13, margin: '0 0 14px' }}>{erro}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={fechar} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={acoesSalvar[acao.tipo]} disabled={salvando} style={{ background: salvando ? t.textoFraco : t.azul, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pecas
