import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { cores } from './theme'

function Clientes({ t, modo }) {
  const [tela, setTela] = useState('lista')
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', cpf: '', endereco: '' })
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    const { data } = await supabase.from('clientes').select('*').order('nome', { ascending: true })
    if (data) setClientes(data)
  }

  async function salvarCliente() {
    if (editando) {
      await supabase.from('clientes').update(form).eq('id', editando.id)
      setEditando(null)
    } else {
      await supabase.from('clientes').insert([form])
    }
    setForm({ nome: '', telefone: '', email: '', cpf: '', endereco: '' })
    setTela('lista')
    carregarClientes()
  }

  async function excluirCliente(id) {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await supabase.from('clientes').delete().eq('id', id)
      carregarClientes()
    }
  }

  function abrirEdicao(cliente) {
    setEditando(cliente)
    setForm({ nome: cliente.nome, telefone: cliente.telefone, email: cliente.email || '', cpf: cliente.cpf || '', endereco: cliente.endereco || '' })
    setTela('form')
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca) ||
    (c.email && c.email.toLowerCase().includes(busca.toLowerCase()))
  )

  const inputStyle = { width: '100%', padding: '11px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto }
  const labelStyle = { fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6, textAlign: 'left' }
  const cardStyle = { background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 16 }

  return (
    <div style={{ width: '100%', fontFamily: 'sans-serif' }}>

      {tela === 'lista' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>Clientes</h1>
            <button onClick={() => { setEditando(null); setForm({ nome: '', telefone: '', email: '', cpf: '', endereco: '' }); setTela('form') }} style={{ background: t.azul, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: '500' }}>
              + Novo cliente
            </button>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ ...cardStyle, display: 'inline-block', minWidth: 180 }}>
              <p style={{ fontSize: 11, color: t.textoFraco, margin: '0 0 8px', letterSpacing: '0.04em' }}>TOTAL DE CLIENTES</p>
              <p style={{ fontSize: 26, fontWeight: '500', color: cores.reparo, margin: 0 }}>{clientes.length}</p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail..." style={inputStyle} />
          </div>

          <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.cardBorda}`, overflow: 'hidden' }}>
            {clientesFiltrados.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: t.textoFraco }}>
                <p style={{ fontSize: 16, marginBottom: 8 }}>{busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}</p>
                <p style={{ fontSize: 13 }}>{busca ? 'Tente outro termo' : 'Clique em + Novo cliente para começar'}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: modo === 'dark' ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }}>
                    {['Nome', 'Telefone', 'E-mail', 'CPF', 'Endereço', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: t.textoFraco, fontWeight: '500', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((c) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${t.cardBorda}` }}>
                      <td style={{ padding: '14px 16px', color: t.texto, fontWeight: '500' }}>{c.nome}</td>
                      <td style={{ padding: '14px 16px', color: t.textoSuave }}>{c.telefone}</td>
                      <td style={{ padding: '14px 16px', color: t.textoSuave }}>{c.email || '—'}</td>
                      <td style={{ padding: '14px 16px', color: t.textoSuave }}>{c.cpf || '—'}</td>
                      <td style={{ padding: '14px 16px', color: t.textoSuave, maxWidth: 180 }}>{c.endereco || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => abrirEdicao(c)} style={{ background: 'transparent', color: cores.aguardando, border: `1px solid ${cores.aguardando}`, padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Editar</button>
                          <button onClick={() => excluirCliente(c.id)} style={{ background: 'transparent', color: cores.perigo, border: `1px solid ${cores.perigo}`, padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tela === 'form' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, maxWidth: 520, margin: '0 auto 22px' }}>
            <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>{editando ? 'Editar cliente' : 'Novo cliente'}</h1>
            <button onClick={() => setTela('lista')} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>← Voltar</button>
          </div>

          <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.cardBorda}`, padding: 32, maxWidth: 520, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Nome completo</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} type="text" placeholder="Ex: João Silva" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Telefone / WhatsApp</label>
              <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} type="text" placeholder="(49) 99999-0000" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>E-mail</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="cliente@email.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>CPF</label>
              <input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} type="text" placeholder="000.000.000-00" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>Endereço</label>
              <input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} type="text" placeholder="Rua, número, bairro, cidade" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setTela('lista')} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvarCliente} style={{ background: t.azul, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: '500' }}>{editando ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

export default Clientes
