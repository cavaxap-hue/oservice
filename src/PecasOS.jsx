import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { cores } from './theme'
import { numero, dinheiro, carregarItensOS, somaItens, mensagemErroEstoque } from './estoqueUtil'

const AVULSA_VAZIA = { descricao: '', quantidade: '1', preco: '', custo: '' }

function arredondar(valor) {
  return Math.round(valor * 100) / 100
}

// Preço/custo digitado: vazio vira 0, aceita vírgula ("80,50"); texto inválido vira NaN
function valorMonetario(texto) {
  if (String(texto ?? '').trim() === '') return 0
  const valor = numero(texto)
  return Number.isNaN(valor) ? NaN : arredondar(valor)
}

// Valor do banco para o campo de texto, com vírgula
function paraCampo(valor) {
  return String(Number(valor) || 0).replace('.', ',')
}

// Seção "Peças" no card expandido da OS. A baixa/devolução de estoque é feita pelo trigger do banco.
function PecasOS({ t, modo, os, empresaId, onAlterado }) {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modoAdicionar, setModoAdicionar] = useState(null) // null | 'estoque' | 'avulsa'
  const [pecasAtivas, setPecasAtivas] = useState([])
  const [busca, setBusca] = useState('')
  const [pecaEscolhida, setPecaEscolhida] = useState(null)
  const [qtdEstoque, setQtdEstoque] = useState('1')
  const [precoEstoque, setPrecoEstoque] = useState('')
  const [avulsa, setAvulsa] = useState(AVULSA_VAZIA)
  const [editando, setEditando] = useState(null) // { id, quantidade, preco }
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarItensOS(os.id, empresaId).then(lista => { setItens(lista); setCarregando(false) })
  }, [os.id])

  // Recalcula valor_pecas e valor da OS a partir dos itens gravados
  async function aposMudanca() {
    const lista = await carregarItensOS(os.id, empresaId)
    setItens(lista)
    const valor_pecas = arredondar(somaItens(lista))
    const { data } = await supabase.from('ordens').select('valor_servico').eq('id', os.id).eq('empresa_id', empresaId).maybeSingle()
    const servico = Number(data?.valor_servico) || 0
    const { error } = await supabase.from('ordens').update({ valor_pecas, valor: arredondar(valor_pecas + servico) }).eq('id', os.id).eq('empresa_id', empresaId)
    if (error) setErro(`Peças salvas, mas não foi possível atualizar o valor da OS. (${error.message})`)
    onAlterado()
  }

  async function abrirEstoque() {
    setErro('')
    setModoAdicionar('estoque')
    setBusca('')
    setPecaEscolhida(null)
    const { data, error } = await supabase.from('pecas').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('nome', { ascending: true })
    if (error) console.error('Erro ao carregar peças:', error)
    setPecasAtivas(data || [])
  }

  function abrirAvulsa() {
    setErro('')
    setModoAdicionar('avulsa')
    setAvulsa(AVULSA_VAZIA)
  }

  function escolherPeca(p) {
    setPecaEscolhida(p)
    setQtdEstoque('1')
    setPrecoEstoque(paraCampo(p.preco_venda))
  }

  // quantidade, preco_unitario e custo_unitario são NOT NULL: nunca enviar null nem ''
  function validarQtdPreco(qtdTexto, precoTexto) {
    const quantidade = numero(qtdTexto)
    if (Number.isNaN(quantidade) || quantidade < 1) return { erro: 'Informe a quantidade' }
    if (!Number.isInteger(quantidade)) return { erro: 'A quantidade deve ser um número inteiro.' }
    const preco = valorMonetario(precoTexto)
    if (Number.isNaN(preco) || preco < 0) return { erro: 'Preço inválido. Use só números, ex.: 80,50' }
    return { quantidade, preco }
  }

  // Mensagem amigável + a mensagem real do banco (exceto estoque insuficiente, que já é específica)
  async function erroDoBanco(error, pecaId) {
    console.error('Erro em os_pecas:', error)
    const texto = await mensagemErroEstoque(error, pecaId, empresaId)
    if ((error?.message || '').includes('ESTOQUE_INSUFICIENTE')) return texto
    return `${texto} (${error?.message || 'erro desconhecido'})`
  }

  async function inserirItem(item, pecaId) {
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('os_pecas').insert([{ ...item, ordem_id: os.id, empresa_id: empresaId }])
    if (error) {
      setErro(await erroDoBanco(error, pecaId))
      setSalvando(false)
      return
    }
    setModoAdicionar(null)
    await aposMudanca()
    setSalvando(false)
  }

  async function adicionarDoEstoque() {
    if (!pecaEscolhida) { setErro('Escolha uma peça.'); return }
    const v = validarQtdPreco(qtdEstoque, precoEstoque)
    if (v.erro) { setErro(v.erro); return }
    await inserirItem({
      peca_id: pecaEscolhida.id,
      descricao: pecaEscolhida.nome,
      quantidade: v.quantidade,
      preco_unitario: v.preco,
      custo_unitario: arredondar(Number(pecaEscolhida.preco_custo) || 0),
      avulsa: false,
    }, pecaEscolhida.id)
  }

  async function adicionarAvulsa() {
    if (!avulsa.descricao.trim()) { setErro('Informe a descrição.'); return }
    const v = validarQtdPreco(avulsa.quantidade, avulsa.preco)
    if (v.erro) { setErro(v.erro); return }
    const custo = valorMonetario(avulsa.custo)
    if (Number.isNaN(custo) || custo < 0) { setErro('Custo inválido. Use só números, ex.: 80,50'); return }
    await inserirItem({
      peca_id: null,
      descricao: avulsa.descricao.trim(),
      quantidade: v.quantidade,
      preco_unitario: v.preco,
      custo_unitario: custo,
      avulsa: true,
    }, null)
  }

  async function salvarEdicao(item) {
    const v = validarQtdPreco(editando.quantidade, editando.preco)
    if (v.erro) { setErro(v.erro); return }
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('os_pecas').update({ quantidade: v.quantidade, preco_unitario: v.preco }).eq('id', item.id).eq('empresa_id', empresaId)
    if (error) {
      setErro(await erroDoBanco(error, item.peca_id))
      setSalvando(false)
      return
    }
    setEditando(null)
    await aposMudanca()
    setSalvando(false)
  }

  async function remover(item) {
    const aviso = item.peca_id ? ' A quantidade volta para o estoque.' : ''
    if (!window.confirm(`Remover "${item.descricao}" desta OS?${aviso}`)) return
    setSalvando(true)
    setErro('')
    const { error } = await supabase.from('os_pecas').delete().eq('id', item.id).eq('empresa_id', empresaId)
    if (error) {
      setErro(await erroDoBanco(error, item.peca_id))
      setSalvando(false)
      return
    }
    await aposMudanca()
    setSalvando(false)
  }

  const total = somaItens(itens)
  const termo = busca.trim().toLowerCase()
  const pecasBusca = pecasAtivas.filter(p => !termo || (p.nome || '').toLowerCase().includes(termo) || (p.codigo || '').toLowerCase().includes(termo)).slice(0, 30)

  const inputStyle = { width: '100%', padding: '9px 11px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto }
  const labelStyle = { fontSize: 12, color: t.textoSuave, display: 'block', marginBottom: 5 }
  const botao = (cor, cheio) => ({ background: cheio ? cor : 'transparent', color: cheio ? '#fff' : cor, border: `1px solid ${cor}`, padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: salvando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontWeight: cheio ? '500' : 'normal', opacity: salvando ? 0.6 : 1 })
  const td = { padding: '8px 10px', fontSize: 13, verticalAlign: 'middle' }
  const fundoSuave = modo === 'dark' ? 'rgba(255,255,255,0.03)' : '#F9FAFB'

  return (
    <div style={{ background: fundoSuave, border: `1px solid ${t.cardBorda}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ color: t.textoFraco, fontSize: 11, letterSpacing: '0.04em' }}>PEÇAS</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button disabled={salvando} onClick={abrirEstoque} style={botao(cores.reparo, modoAdicionar === 'estoque')}>+ Adicionar do estoque</button>
          <button disabled={salvando} onClick={abrirAvulsa} style={botao('#7C5CD6', modoAdicionar === 'avulsa')}>+ Adicionar avulsa</button>
        </div>
      </div>

      {carregando ? (
        <div style={{ color: t.textoFraco, fontSize: 13, padding: '8px 0' }}>Carregando...</div>
      ) : itens.length === 0 ? (
        <div style={{ color: t.textoFraco, fontSize: 13, padding: '8px 0' }}>Nenhuma peça lançada nesta OS.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr>
                <th style={{ ...td, textAlign: 'left', color: t.textoFraco, fontWeight: '500', fontSize: 11 }}>Descrição</th>
                <th style={{ ...td, textAlign: 'right', color: t.textoFraco, fontWeight: '500', fontSize: 11 }}>Qtd.</th>
                <th style={{ ...td, textAlign: 'right', color: t.textoFraco, fontWeight: '500', fontSize: 11 }}>Preço un.</th>
                <th style={{ ...td, textAlign: 'right', color: t.textoFraco, fontWeight: '500', fontSize: 11 }}>Subtotal</th>
                <th style={td}></th>
              </tr>
            </thead>
            <tbody>
              {itens.map(item => {
                const emEdicao = editando?.id === item.id
                return (
                  <tr key={item.id} style={{ borderTop: `1px solid ${t.cardBorda}` }}>
                    <td style={{ ...td, color: t.texto }}>
                      {item.descricao}
                      {item.avulsa && <span style={{ marginLeft: 8, fontSize: 10, color: '#7C5CD6', border: '1px solid #7C5CD6', borderRadius: 10, padding: '1px 7px' }}>avulsa</span>}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: t.textoSuave }}>
                      {emEdicao
                        ? <input type="number" min={1} step="1" value={editando.quantidade} onChange={e => setEditando({ ...editando, quantidade: e.target.value })} style={{ ...inputStyle, width: 70, padding: '6px 8px', textAlign: 'right' }} />
                        : Number(item.quantidade)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: t.textoSuave, whiteSpace: 'nowrap' }}>
                      {emEdicao
                        ? <input type="text" inputMode="decimal" placeholder="0,00" value={editando.preco} onChange={e => setEditando({ ...editando, preco: e.target.value })} style={{ ...inputStyle, width: 96, padding: '6px 8px', textAlign: 'right' }} />
                        : dinheiro(item.preco_unitario)}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: t.texto, fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {dinheiro(Number(item.quantidade) * Number(item.preco_unitario))}
                    </td>
                    <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {emEdicao ? (
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button disabled={salvando} onClick={() => salvarEdicao(item)} style={botao(cores.pronto, true)}>Salvar</button>
                          <button disabled={salvando} onClick={() => { setEditando(null); setErro('') }} style={botao(t.textoSuave)}>Cancelar</button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button disabled={salvando} onClick={() => { setErro(''); setEditando({ id: item.id, quantidade: String(Number(item.quantidade)), preco: paraCampo(item.preco_unitario) }) }} style={botao(cores.aguardando)}>✏</button>
                          <button disabled={salvando} onClick={() => remover(item)} style={botao(cores.perigo)}>🗑</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              <tr style={{ borderTop: `1px solid ${t.borda}` }}>
                <td colSpan={3} style={{ ...td, textAlign: 'right', color: t.textoSuave, fontWeight: '500' }}>Total das peças</td>
                <td style={{ ...td, textAlign: 'right', color: cores.pronto, fontWeight: '600', whiteSpace: 'nowrap' }}>{dinheiro(total)}</td>
                <td style={td}></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {modoAdicionar === 'estoque' && (
        <div style={{ borderTop: `1px solid ${t.cardBorda}`, marginTop: 12, paddingTop: 12 }}>
          {!pecaEscolhida ? (
            <>
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar peça por nome ou código..." style={{ ...inputStyle, marginBottom: 8 }} autoFocus />
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pecasBusca.length === 0 ? (
                  <div style={{ color: t.textoFraco, fontSize: 13, padding: '8px 0' }}>{pecasAtivas.length ? 'Nenhuma peça encontrada.' : 'Nenhuma peça ativa cadastrada. Cadastre em Peças.'}</div>
                ) : pecasBusca.map(p => {
                  const disponivel = Number(p.quantidade) || 0
                  return (
                    <div key={p.id} onClick={() => escolherPeca(p)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: `1px solid ${t.cardBorda}`, background: t.card, cursor: 'pointer' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: t.texto, fontSize: 13, fontWeight: '500' }}>{p.nome}</div>
                        <div style={{ color: t.textoFraco, fontSize: 11 }}>{p.codigo ? `${p.codigo} · ` : ''}{dinheiro(p.preco_venda)}</div>
                      </div>
                      <span style={{ fontSize: 12, whiteSpace: 'nowrap', color: disponivel > 0 ? t.textoSuave : cores.perigo }}>{disponivel} disponível(is)</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ color: t.texto, fontSize: 14, fontWeight: '500' }}>
                  {pecaEscolhida.nome} <span style={{ color: t.textoFraco, fontSize: 12, fontWeight: 'normal' }}>· {Number(pecaEscolhida.quantidade) || 0} disponível(is)</span>
                </div>
                <button onClick={() => setPecaEscolhida(null)} style={{ background: 'transparent', border: 'none', color: t.textoFraco, fontSize: 12, cursor: 'pointer' }}>trocar</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Quantidade</label>
                  <input type="number" min={1} step="1" value={qtdEstoque} onChange={e => setQtdEstoque(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Preço unitário (R$)</label>
                  <input type="text" inputMode="decimal" placeholder="0,00" value={precoEstoque} onChange={e => setPrecoEstoque(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => { setModoAdicionar(null); setErro('') }} style={botao(t.textoSuave)}>Cancelar</button>
            {pecaEscolhida && <button disabled={salvando} onClick={adicionarDoEstoque} style={botao(cores.pronto, true)}>{salvando ? 'Salvando...' : 'Adicionar'}</button>}
          </div>
        </div>
      )}

      {modoAdicionar === 'avulsa' && (
        <div style={{ borderTop: `1px solid ${t.cardBorda}`, marginTop: 12, paddingTop: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Descrição</label>
            <input value={avulsa.descricao} onChange={e => setAvulsa({ ...avulsa, descricao: e.target.value })} placeholder="Ex: SSD 240GB usado" style={inputStyle} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Quantidade</label>
              <input type="number" min={1} step="1" value={avulsa.quantidade} onChange={e => setAvulsa({ ...avulsa, quantidade: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Preço unitário (R$)</label>
              <input type="text" inputMode="decimal" value={avulsa.preco} onChange={e => setAvulsa({ ...avulsa, preco: e.target.value })} placeholder="0,00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Custo (opcional)</label>
              <input type="text" inputMode="decimal" value={avulsa.custo} onChange={e => setAvulsa({ ...avulsa, custo: e.target.value })} placeholder="0,00" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setModoAdicionar(null); setErro('') }} style={botao(t.textoSuave)}>Cancelar</button>
            <button disabled={salvando} onClick={adicionarAvulsa} style={botao(cores.pronto, true)}>{salvando ? 'Salvando...' : 'Adicionar'}</button>
          </div>
        </div>
      )}

      {erro && <p style={{ color: cores.perigo, fontSize: 13, margin: '10px 0 0' }}>{erro}</p>}
    </div>
  )
}

export default PecasOS
