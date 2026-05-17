import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function Dashboard({ onSair }) {
  const [tela, setTela] = useState('lista')
  const [ordens, setOrdens] = useState([])
  const [form, setForm] = useState({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '' })

  useEffect(() => {
    carregarOrdens()
  }, [])

  async function carregarOrdens() {
    const { data } = await supabase.from('ordens').select('*').order('created_at', { ascending: false })
    if (data) setOrdens(data)
  }

  async function salvarOS() {
    await supabase.from('ordens').insert([{ ...form, status: 'Aguardando' }])
    setForm({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '' })
    setTela('lista')
    carregarOrdens()
  }

  async function mudarStatus(id, novoStatus) {
    await supabase.from('ordens').update({ status: novoStatus }).eq('id', id)
    carregarOrdens()
  }

  async function excluirOS(id) {
    if (window.confirm('Tem certeza que deseja excluir esta OS?')) {
      await supabase.from('ordens').delete().eq('id', id)
      carregarOrdens()
    }
  }

  function statusCor(status) {
    if (status === 'Em reparo') return { cor: '#185FA5', bg: '#EEF4FB' }
    if (status === 'Pronto') return { cor: '#2E9E52', bg: '#E8F5EE' }
    if (status === 'Entregue') return { cor: '#666', bg: '#F0F0F0' }
    return { cor: '#E6A817', bg: '#FEF6E4' }
  }

  const proximoStatus = { 'Aguardando': 'Em reparo', 'Em reparo': 'Pronto', 'Pronto': 'Entregue' }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4F6F9', display: 'flex' }}>

      <div style={{ width: '220px', background: '#fff', borderRight: '1px solid #E0E0E0', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #E0E0E0', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', color: '#185FA5', margin: 0 }}>OService</h2>
          <small style={{ color: '#999', fontSize: '12px' }}>Painel principal</small>
          <button onClick={onSair} style={{ marginTop: '8px', display: 'block', background: 'none', border: 'none', color: '#999', fontSize: '12px', cursor: 'pointer', padding: 0 }}>Sair →</button>
        </div>
        <div onClick={() => setTela('lista')} style={{ padding: '8px 20px', fontSize: '14px', color: tela === 'lista' ? '#185FA5' : '#666', fontWeight: tela === 'lista' ? '500' : 'normal', background: tela === 'lista' ? '#EEF4FB' : 'transparent', borderRight: tela === 'lista' ? '3px solid #185FA5' : 'none', cursor: 'pointer' }}>📋 Ordens de Serviço</div>
        <div style={{ padding: '8px 20px', fontSize: '14px', color: '#666', cursor: 'pointer' }}>👥 Clientes</div>
        <div style={{ padding: '8px 20px', fontSize: '14px', color: '#666', cursor: 'pointer' }}>📊 Relatórios</div>
        <div style={{ padding: '8px 20px', fontSize: '14px', color: '#666', cursor: 'pointer' }}>⚙️ Configurações</div>
      </div>

      <div style={{ flex: 1, padding: '32px' }}>

        {tela === 'lista' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '20px', color: '#333', margin: 0 }}>Ordens de Serviço</h1>
              <button onClick={() => setTela('nova')} style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                + Nova OS
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Total', valor: ordens.length, cor: '#185FA5' },
                { label: 'Em reparo', valor: ordens.filter(o => o.status === 'Em reparo').length, cor: '#E6A817' },
                { label: 'Prontas', valor: ordens.filter(o => o.status === 'Pronto').length, cor: '#2E9E52' },
                { label: 'Aguardando', valor: ordens.filter(o => o.status === 'Aguardando').length, cor: '#E63946' },
              ].map((card) => (
                <div key={card.label} style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #E0E0E0' }}>
                  <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px' }}>{card.label}</p>
                  <p style={{ fontSize: '28px', fontWeight: '600', color: card.cor, margin: 0 }}>{card.valor}</p>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E0E0E0', overflow: 'hidden' }}>
              {ordens.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>Nenhuma OS cadastrada ainda</p>
                  <p style={{ fontSize: '13px' }}>Clique em + Nova OS para começar</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Cliente</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Equipamento</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Problema</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Ação</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordens.map((os) => {
                      const { cor, bg } = statusCor(os.status)
                      return (
                        <tr key={os.id} style={{ borderTop: '1px solid #F0F0F0' }}>
                          <td style={{ padding: '14px 16px', color: '#333', fontWeight: '500' }}>
                            <div>{os.cliente}</div>
                            <div style={{ fontSize: '12px', color: '#999' }}>{os.telefone}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#666' }}>{os.tipo} — {os.modelo}</td>
                          <td style={{ padding: '14px 16px', color: '#666', maxWidth: '180px' }}>{os.problema}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: bg, color: cor, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                              {os.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {proximoStatus[os.status] && (
                              <button onClick={() => mudarStatus(os.id, proximoStatus[os.status])} style={{ background: '#F4F6F9', color: '#333', border: '1px solid #E0E0E0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                → {proximoStatus[os.status]}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <button onClick={() => excluirOS(os.id)} style={{ background: 'none', color: '#E63946', border: '1px solid #E63946', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                              🗑 Excluir
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {tela === 'nova' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '20px', color: '#333', margin: 0 }}>Nova Ordem de Serviço</h1>
              <button onClick={() => setTela('lista')} style={{ background: '#fff', color: '#666', border: '1px solid #DDD', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                ← Voltar
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E0E0E0', padding: '24px', maxWidth: '600px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Dados do cliente</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Nome do cliente</label>
                  <input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} type="text" placeholder="Ex: João Silva" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Telefone / WhatsApp</label>
                  <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} type="text" placeholder="(49) 99999-0000" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>

              <p style={{ fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', marginTop: '24px' }}>Equipamento</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none', background: '#fff' }}>
                    <option>Notebook</option>
                    <option>Nobreak</option>
                    <option>Placa-mãe</option>
                    <option>Desktop</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Marca / Modelo</label>
                  <input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} type="text" placeholder="Ex: Dell Inspiron 15" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Problema relatado</label>
                <textarea value={form.problema} onChange={e => setForm({ ...form, problema: e.target.value })} placeholder="Descreva o que o cliente relatou..." rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setTela('lista')} style={{ background: '#fff', color: '#666', border: '1px solid #DDD', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={salvarOS} style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                  Abrir OS
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Dashboard