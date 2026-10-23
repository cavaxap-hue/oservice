import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { cores } from './theme'
import { dinheiro } from './estoqueUtil'

const TIPOS_MOVIMENTO = {
  entrada: 'Entrada',
  saida_os: 'Saída (OS)',
  retorno_os: 'Retorno (OS)',
  ajuste: 'Ajuste',
}

const LIMITE_HISTORICO = 300
const DIAS_MAIS_USADAS = 30

function Estoque({ t, modo, empresaId }) {
  const [pecas, setPecas] = useState([])
  const [maisUsadas, setMaisUsadas] = useState([]) // [{ peca_id, usadas }]
  const [carregando, setCarregando] = useState(true)
  const [mostrarMovimentos, setMostrarMovimentos] = useState(false)
  const [movimentos, setMovimentos] = useState([])
  const [numerosOS, setNumerosOS] = useState({}) // ordem_id → numero
  const [filtroPeca, setFiltroPeca] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  async function carregarResumo() {
    const desde = new Date(Date.now() - DIAS_MAIS_USADAS * 24 * 60 * 60 * 1000).toISOString()
    const [{ data: listaPecas, error: errPecas }, { data: movOS, error: errMov }] = await Promise.all([
      supabase.from('pecas').select('id, nome, codigo, quantidade, estoque_minimo, preco_custo, ativo').eq('empresa_id', empresaId).order('nome', { ascending: true }),
      supabase.from('estoque_movimentos').select('peca_id, tipo, quantidade').eq('empresa_id', empresaId).in('tipo', ['saida_os', 'retorno_os']).gte('created_at', desde),
    ])
    if (errPecas) console.error('Erro ao carregar peças:', errPecas)
    if (errMov) console.error('Erro ao carregar movimentações:', errMov)
    setPecas(listaPecas || [])

    // Saída em OS entra negativa e retorno positivo: usadas = -(soma)
    const porPeca = {}
    ;(movOS || []).forEach(m => {
      if (!m.peca_id) return
      porPeca[m.peca_id] = (porPeca[m.peca_id] || 0) - (Number(m.quantidade) || 0)
    })
    setMaisUsadas(
      Object.entries(porPeca)
        .map(([peca_id, usadas]) => ({ peca_id, usadas }))
        .filter(p => p.usadas > 0)
        .sort((a, b) => b.usadas - a.usadas)
        .slice(0, 10)
    )
    setCarregando(false)
  }

  async function carregarMovimentos() {
    setCarregandoHistorico(true)
    let consulta = supabase.from('estoque_movimentos').select('*').eq('empresa_id', empresaId)
    if (filtroPeca) consulta = consulta.eq('peca_id', filtroPeca)
    if (inicio) consulta = consulta.gte('created_at', new Date(inicio + 'T00:00:00').toISOString())
    if (fim) consulta = consulta.lte('created_at', new Date(fim + 'T23:59:59.999').toISOString())
    const { data, error } = await consulta.order('created_at', { ascending: false }).limit(LIMITE_HISTORICO)
    if (error) console.error('Erro ao carregar movimentações:', error)
    const lista = data || []
    setMovimentos(lista)

    // Nº das OS citadas no histórico
    const idsOS = [...new Set(lista.map(m => m.ordem_id).filter(Boolean))]
    if (idsOS.length) {
      const { data: ordens } = await supabase.from('ordens').select('id, numero').eq('empresa_id', empresaId).in('id', idsOS)
      setNumerosOS(Object.fromEntries((ordens || []).map(o => [o.id, o.numero])))
    }
    setCarregandoHistorico(false)
  }

  useEffect(() => {
    carregarResumo()
  }, [])

  // O histórico só é consultado quando está aberto
  useEffect(() => {
    if (mostrarMovimentos) carregarMovimentos()
  }, [mostrarMovimentos, filtroPeca, inicio, fim])

  const nomesPecas = Object.fromEntries(pecas.map(p => [p.id, p.nome]))
  const ativas = pecas.filter(p => p.ativo)
  const unidades = ativas.reduce((acc, p) => acc + (Number(p.quantidade) || 0), 0)
  const valorEmEstoque = ativas.reduce((acc, p) => acc + (Number(p.preco_custo) || 0) * Math.max(Number(p.quantidade) || 0, 0), 0)
  const comprar = ativas
    .filter(p => Number(p.quantidade) <= Number(p.estoque_minimo || 0))
    .map(p => ({ ...p, falta: Math.max(Number(p.estoque_minimo || 0) - (Number(p.quantidade) || 0), 0) }))
    .sort((a, b) => b.falta - a.falta || a.nome.localeCompare(b.nome))

  const inputStyle = { padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto, colorScheme: modo === 'dark' ? 'dark' : 'light' }
  const labelStyle = { fontSize: 12, color: t.textoSuave, display: 'block', marginBottom: 6 }
  const thStyle = { padding: '10px 12px', textAlign: 'left', color: t.textoFraco, fontWeight: '500', fontSize: 12, whiteSpace: 'nowrap' }
  const blocoStyle = { background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, marginBottom: 16 }
  const tituloBloco = { color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 4 }
  const subtituloBloco = { color: t.textoFraco, fontSize: 12, marginBottom: 14 }
  const vazio = { padding: '16px 0', textAlign: 'center', color: t.textoFraco, fontSize: 13 }

  if (carregando) return <div style={{ color: t.textoFraco, padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>Estoque</h1>
        <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>Resumo do estoque, o que comprar e o que mais sai nas OS</p>
      </div>

      {/* Cartões */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
        {[
          { rotulo: 'PEÇAS ATIVAS', valor: ativas.length, icone: '◆', cor: t.azul },
          { rotulo: 'UNIDADES EM ESTOQUE', valor: unidades, icone: '▥', cor: '#9BB5D4' },
          { rotulo: 'VALOR EM ESTOQUE (CUSTO)', valor: dinheiro(valorEmEstoque), icone: '💰', cor: cores.pronto },
        ].map(c => (
          <div key={c.rotulo} style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c.cor }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em' }}>{c.rotulo}</span>
              <span style={{ fontSize: 16 }}>{c.icone}</span>
            </div>
            <div style={{ color: t.texto, fontSize: 26, fontWeight: '500', marginTop: 8 }}>{c.valor}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 0 }}>
        {/* Comprar */}
        <div style={{ ...blocoStyle, border: `1px solid ${comprar.length ? cores.perigo : t.cardBorda}` }}>
          <div style={tituloBloco}>{comprar.length ? '⚠ ' : ''}Comprar</div>
          <div style={subtituloBloco}>Peças ativas no estoque mínimo ou abaixo dele</div>
          {comprar.length === 0 ? (
            <div style={vazio}>Nada para comprar agora.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Peça</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Tem</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Mínimo</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Falta</th>
                  </tr>
                </thead>
                <tbody>
                  {comprar.map(p => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${t.cardBorda}` }}>
                      <td style={{ padding: '10px 12px', color: t.texto, fontWeight: '500' }}>
                        {p.nome}
                        {p.codigo && <span style={{ color: t.textoFraco, fontFamily: 'monospace', fontSize: 12, marginLeft: 6 }}>{p.codigo}</span>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: cores.perigo, fontWeight: '600' }}>{Number(p.quantidade) || 0}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: t.textoSuave }}>{Number(p.estoque_minimo) || 0}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: t.texto, fontWeight: '600' }}>
                        {p.falta > 0 ? p.falta : <span style={{ color: t.textoFraco, fontWeight: 'normal', fontSize: 12 }}>no limite</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mais usadas */}
        <div style={blocoStyle}>
          <div style={tituloBloco}>Mais usadas ({DIAS_MAIS_USADAS} dias)</div>
          <div style={subtituloBloco}>Unidades que saíram em OS, descontados os retornos</div>
          {maisUsadas.length === 0 ? (
            <div style={vazio}>Nenhuma peça saiu em OS nos últimos {DIAS_MAIS_USADAS} dias.</div>
          ) : (
            <div>
              {maisUsadas.map((p, i) => {
                const largura = (p.usadas / maisUsadas[0].usadas) * 100
                return (
                  <div key={p.peca_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.cardBorda}` }}>
                    <span style={{ width: 18, color: t.textoFraco, fontSize: 12, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: t.texto, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>{nomesPecas[p.peca_id] || 'Peça removida'}</div>
                      <div style={{ background: modo === 'dark' ? 'rgba(255,255,255,0.06)' : '#EEE', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${largura}%`, height: '100%', background: cores.reparo }}></div>
                      </div>
                    </div>
                    <span style={{ color: t.texto, fontSize: 13, fontWeight: '600', minWidth: 32, textAlign: 'right', flexShrink: 0 }}>{p.usadas}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Histórico (escondido por padrão) */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setMostrarMovimentos(!mostrarMovimentos)} style={{ background: 'transparent', color: t.azul, border: `1px solid ${t.azul}`, padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: '500' }}>
          {mostrarMovimentos ? '▲ Esconder movimentações' : '▼ Ver movimentações'}
        </button>
      </div>

      {mostrarMovimentos && (
        <div style={blocoStyle}>
          <div style={{ ...tituloBloco, marginBottom: 14 }}>Histórico de movimentações</div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={labelStyle}>Peça</label>
              <select value={filtroPeca} onChange={e => setFiltroPeca(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                <option value="">Todas as peças</option>
                {pecas.map(p => <option key={p.id} value={p.id}>{p.nome}{p.ativo ? '' : ' (inativa)'}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>De</label>
              <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Até</label>
              <input type="date" value={fim} onChange={e => setFim(e.target.value)} style={inputStyle} />
            </div>
            {(filtroPeca || inicio || fim) && (
              <button onClick={() => { setFiltroPeca(''); setInicio(''); setFim('') }} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Limpar</button>
            )}
          </div>

          {carregandoHistorico ? (
            <div style={vazio}>Carregando...</div>
          ) : movimentos.length === 0 ? (
            <div style={vazio}>Nenhuma movimentação encontrada.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Data</th>
                    <th style={thStyle}>Peça</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Qtd.</th>
                    <th style={thStyle}>OS</th>
                    <th style={thStyle}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentos.map(m => {
                    const qtd = Number(m.quantidade) || 0
                    const data = new Date(m.created_at)
                    return (
                      <tr key={m.id} style={{ borderTop: `1px solid ${t.cardBorda}` }}>
                        <td style={{ padding: '10px 12px', color: t.textoSuave, whiteSpace: 'nowrap', fontSize: 13 }}>
                          {data.toLocaleDateString('pt-BR')} {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px 12px', color: t.texto }}>{nomesPecas[m.peca_id] || '—'}</td>
                        <td style={{ padding: '10px 12px', color: t.textoSuave, whiteSpace: 'nowrap' }}>{TIPOS_MOVIMENTO[m.tipo] || m.tipo}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap', color: qtd > 0 ? cores.pronto : qtd < 0 ? cores.perigo : t.textoSuave }}>
                          {qtd > 0 ? `+${qtd}` : qtd}
                        </td>
                        <td style={{ padding: '10px 12px', color: t.textoSuave, fontFamily: 'monospace', fontSize: 13 }}>
                          {m.ordem_id ? (numerosOS[m.ordem_id] != null ? `#${String(numerosOS[m.ordem_id]).padStart(4, '0')}` : '(excluída)') : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: t.textoSuave, fontSize: 13 }}>{m.observacao || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {movimentos.length === LIMITE_HISTORICO && (
                <p style={{ color: t.textoFraco, fontSize: 12, margin: '12px 0 0' }}>Mostrando as {LIMITE_HISTORICO} movimentações mais recentes. Use os filtros para ver períodos anteriores.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Estoque
