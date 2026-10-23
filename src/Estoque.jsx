import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { cores } from './theme'

const TIPOS_MOVIMENTO = {
  entrada: 'Entrada',
  saida_os: 'Saída (OS)',
  retorno_os: 'Retorno (OS)',
  ajuste: 'Ajuste',
}

const LIMITE_HISTORICO = 300

function Estoque({ t, modo, empresaId }) {
  const [pecas, setPecas] = useState([])
  const [movimentos, setMovimentos] = useState([])
  const [numerosOS, setNumerosOS] = useState({}) // ordem_id → numero
  const [filtroPeca, setFiltroPeca] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [carregandoHistorico, setCarregandoHistorico] = useState(true)

  async function carregarPecas() {
    const { data, error } = await supabase.from('pecas').select('id, nome, codigo, quantidade, estoque_minimo, ativo').eq('empresa_id', empresaId).order('nome', { ascending: true })
    if (error) console.error('Erro ao carregar peças:', error)
    if (data) setPecas(data)
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
    carregarPecas()
  }, [])

  useEffect(() => {
    carregarMovimentos()
  }, [filtroPeca, inicio, fim])

  const nomesPecas = Object.fromEntries(pecas.map(p => [p.id, p.nome]))
  const abaixoDoMinimo = pecas.filter(p => p.ativo && Number(p.quantidade) <= Number(p.estoque_minimo || 0))

  const inputStyle = { padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto, colorScheme: modo === 'dark' ? 'dark' : 'light' }
  const labelStyle = { fontSize: 12, color: t.textoSuave, display: 'block', marginBottom: 6 }
  const thStyle = { padding: '10px 12px', textAlign: 'left', color: t.textoFraco, fontWeight: '500', fontSize: 12, whiteSpace: 'nowrap' }

  if (carregando) return <div style={{ color: t.textoFraco, padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>Estoque</h1>
        <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>Peças em falta e histórico de entradas, saídas e ajustes</p>
      </div>

      {/* Abaixo do mínimo */}
      <div style={{ background: t.card, border: `1px solid ${abaixoDoMinimo.length ? cores.perigo : t.cardBorda}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
          {abaixoDoMinimo.length ? '⚠ ' : ''}Abaixo do mínimo
        </div>
        <div style={{ color: t.textoFraco, fontSize: 12, marginBottom: 14 }}>Peças ativas com quantidade igual ou menor que o estoque mínimo</div>
        {abaixoDoMinimo.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: t.textoFraco, fontSize: 13 }}>Nenhuma peça abaixo do mínimo.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Peça</th>
                  <th style={thStyle}>Código</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Em estoque</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {abaixoDoMinimo.map(p => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${t.cardBorda}` }}>
                    <td style={{ padding: '10px 12px', color: t.texto, fontWeight: '500' }}>{p.nome}</td>
                    <td style={{ padding: '10px 12px', color: t.textoSuave, fontFamily: 'monospace', fontSize: 13 }}>{p.codigo || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: cores.perigo, fontWeight: '600' }}>{Number(p.quantidade) || 0}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: t.textoSuave }}>{Number(p.estoque_minimo) || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Histórico */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18 }}>
        <div style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500', marginBottom: 14 }}>Histórico de movimentações</div>

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
          <div style={{ padding: '24px 0', textAlign: 'center', color: t.textoFraco, fontSize: 13 }}>Carregando...</div>
        ) : movimentos.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: t.textoFraco, fontSize: 13 }}>Nenhuma movimentação encontrada.</div>
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
    </div>
  )
}

export default Estoque
