import { useState, useEffect } from 'react'
import { supabase } from './supabase'

function Dashboard({ onSair }) {
  const [tela, setTela] = useState('lista')
  const [ordens, setOrdens] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [osEditando, setOsEditando] = useState(null)
  const [form, setForm] = useState({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor: '' })

  useEffect(() => {
    carregarOrdens()
  }, [])

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
    await supabase.from('ordens').insert([{ ...form, status: 'Aguardando', valor: form.valor ? parseFloat(form.valor) : null, numero }])
    setForm({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor: '' })
    setTela('lista')
    carregarOrdens()
  }

  async function salvarEdicao() {
    await supabase.from('ordens').update({
      cliente: form.cliente,
      telefone: form.telefone,
      tipo: form.tipo,
      modelo: form.modelo,
      problema: form.problema,
      observacoes: form.observacoes,
      valor: form.valor ? parseFloat(form.valor) : null
    }).eq('id', osEditando.id)
    setOsEditando(null)
    setForm({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor: '' })
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

  function abrirEdicao(os) {
    setOsEditando(os)
    setForm({ cliente: os.cliente, telefone: os.telefone, tipo: os.tipo, modelo: os.modelo, problema: os.problema, observacoes: os.observacoes || '', valor: os.valor || '' })
    setTela('editar')
  }

  function imprimirOS(os) {
    const janela = window.open('', '_blank')
    janela.document.write(`
      <html>
        <head>
          <title>OS #${String(os.numero).padStart(4, '0')}</title>
          <style>
            body { font-family: sans-serif; padding: 32px; color: #333; max-width: 600px; margin: 0 auto; }
            h1 { color: #185FA5; margin-bottom: 4px; }
            .sub { color: #999; font-size: 13px; margin-bottom: 32px; }
            .numero { font-size: 22px; font-weight: 600; margin-bottom: 24px; }
            .secao { margin-bottom: 20px; }
            .secao label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
            .secao p { font-size: 15px; margin: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; background: #EEF4FB; color: #185FA5; }
            .rodape { margin-top: 48px; border-top: 1px solid #E0E0E0; padding-top: 16px; font-size: 12px; color: #999; }
            .assinatura { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 48px; }
            .linha { border-top: 1px solid #333; padding-top: 8px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>OService</h1>
          <p class="sub">Ordem de Serviço</p>
          <p class="numero">OS #${String(os.numero).padStart(4, '0')}</p>
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
          ${os.valor ? `<div class="secao"><label>Valor do serviço</label><p>R$ ${parseFloat(os.valor).toFixed(2)}</p></div>` : ''}
          <div class="secao"><label>Data de entrada</label><p>${new Date(os.created_at).toLocaleDateString('pt-BR')}</p></div>
          <div class="assinatura">
            <div><div class="linha">Assinatura do cliente</div></div>
            <div><div class="linha">Assinatura do técnico</div></div>
          </div>
          <div class="rodape">Documento gerado pelo OService</div>
        </body>
      </html>
    `)
    janela.document.close()
    janela.print()
  }

  function statusCor(status) {
    if (status === 'Em reparo') return { cor: '#185FA5', bg: '#EEF4FB' }
    if (status === 'Pronto') return { cor: '#2E9E52', bg: '#E8F5EE' }
    if (status === 'Entregue') return { cor: '#666', bg: '#F0F0F0' }
    return { cor: '#E6A817', bg: '#FEF6E4' }
  }

  function diasAberta(created_at) {
    const dias = Math.floor((new Date() - new Date(created_at)) / (1000 * 60 * 60 * 24))
    if (dias === 0) return 'Hoje'
    if (dias === 1) return '1 dia'
    return `${dias} dias`
  }

  const proximoStatus = { 'Aguardando': 'Em reparo', 'Em reparo': 'Pronto', 'Pronto': 'Entregue' }

  const ordensFiltradas = ordens.filter(o => {
    const buscaOk = o.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      o.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      o.telefone.includes(busca)
    const filtroOk = filtroStatus === '' || o.status === filtroStatus
    return buscaOk && filtroOk
  })

  const totalReceita = ordens.filter(o => o.status === 'Entregue' && o.valor).reduce((acc, o) => acc + parseFloat(o.valor), 0)

  const formulario = (
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
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Problema relatado</label>
        <textarea value={form.problema} onChange={e => setForm({ ...form, problema: e.target.value })} placeholder="Descreva o que o cliente relatou..." rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Observações técnicas</label>
        <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="O que foi feito, peças trocadas, diagnóstico..." rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Valor do serviço (R$)</label>
        <input value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} type="number" placeholder="0,00" style={{ width: '200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button onClick={() => { setTela('lista'); setOsEditando(null); setForm({ cliente: '', telefone: '', tipo: 'Notebook', modelo: '', problema: '', observacoes: '', valor: '' }) }} style={{ background: '#fff', color: '#666', border: '1px solid #DDD', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={osEditando ? salvarEdicao : salvarOS} style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
          {osEditando ? 'Salvar alterações' : 'Abrir OS'}
        </button>
      </div>
    </div>
  )

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
              <div>
                <h1 style={{ fontSize: '20px', color: '#333', margin: 0 }}>Ordens de Serviço</h1>
                {totalReceita > 0 && <p style={{ fontSize: '13px', color: '#2E9E52', margin: '4px 0 0', fontWeight: '500' }}>💰 Receita entregues: R$ {totalReceita.toFixed(2)}</p>}
              </div>
              <button onClick={() => setTela('nova')} style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                + Nova OS
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total', valor: ordens.length, cor: '#185FA5', filtro: '' },
                { label: 'Em reparo', valor: ordens.filter(o => o.status === 'Em reparo').length, cor: '#E6A817', filtro: 'Em reparo' },
                { label: 'Prontas', valor: ordens.filter(o => o.status === 'Pronto').length, cor: '#2E9E52', filtro: 'Pronto' },
                { label: 'Aguardando', valor: ordens.filter(o => o.status === 'Aguardando').length, cor: '#E63946', filtro: 'Aguardando' },
              ].map((card) => (
                <div key={card.label} onClick={() => setFiltroStatus(filtroStatus === card.filtro ? '' : card.filtro)} style={{ background: filtroStatus === card.filtro ? card.cor : '#fff', borderRadius: '10px', padding: '20px', border: `1px solid ${filtroStatus === card.filtro ? card.cor : '#E0E0E0'}`, cursor: 'pointer' }}>
                  <p style={{ fontSize: '12px', color: filtroStatus === card.filtro ? 'rgba(255,255,255,0.8)' : '#999', margin: '0 0 8px' }}>{card.label}</p>
                  <p style={{ fontSize: '28px', fontWeight: '600', color: filtroStatus === card.filtro ? '#fff' : card.cor, margin: 0 }}>{card.valor}</p>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar por cliente, modelo ou telefone..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none', background: '#fff' }} />
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E0E0E0', overflow: 'hidden' }}>
              {ordensFiltradas.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>{busca ? 'Nenhuma OS encontrada' : 'Nenhuma OS cadastrada ainda'}</p>
                  <p style={{ fontSize: '13px' }}>{busca ? 'Tente outro termo' : 'Clique em + Nova OS para começar'}</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Nº</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Cliente</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Equipamento</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Problema</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Valor</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Tempo</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordensFiltradas.map((os) => {
                      const { cor, bg } = statusCor(os.status)
                      return (
                        <tr key={os.id} style={{ borderTop: '1px solid #F0F0F0' }}>
                          <td style={{ padding: '14px 16px', color: '#999', fontFamily: 'monospace', fontSize: '13px' }}>
                            #{String(os.numero || 0).padStart(4, '0')}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#333', fontWeight: '500' }}>
                            <div>{os.cliente}</div>
                            <div style={{ fontSize: '12px', color: '#999' }}>{os.telefone}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#666' }}>{os.tipo} — {os.modelo}</td>
                          <td style={{ padding: '14px 16px', color: '#666', maxWidth: '160px' }}>
                            <div>{os.problema}</div>
                            {os.observacoes && <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>📝 {os.observacoes}</div>}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#333', fontWeight: '500' }}>
                            {os.valor ? `R$ ${parseFloat(os.valor).toFixed(2)}` : '—'}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#999', fontSize: '12px' }}>
                            {diasAberta(os.created_at)}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: bg, color: cor, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                              {os.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {proximoStatus[os.status] && (
                                <button onClick={() => mudarStatus(os.id, proximoStatus[os.status])} style={{ background: '#F4F6F9', color: '#333', border: '1px solid #E0E0E0', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                                  → {proximoStatus[os.status]}
                                </button>
                              )}
                              <button onClick={() => abrirEdicao(os)} style={{ background: '#FEF6E4', color: '#E6A817', border: '1px solid #E6A817', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                                ✏️ Editar
                              </button>
                              <button onClick={() => imprimirOS(os)} style={{ background: '#EEF4FB', color: '#185FA5', border: '1px solid #185FA5', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                                🖨️ Imprimir
                              </button>
                              <button onClick={() => excluirOS(os.id)} style={{ background: 'none', color: '#E63946', border: '1px solid #E63946', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
  🗑 Excluir
</button>
                            </div>
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

        {(tela === 'nova' || tela === 'editar') && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '20px', color: '#333', margin: 0 }}>
                {tela === 'editar' ? `Editando OS #${String(osEditando?.numero || 0).padStart(4, '0')}` : 'Nova Ordem de Serviço'}
              </h1>
              <button onClick={() => { setTela('lista'); setOsEditando(null) }} style={{ background: '#fff', color: '#666', border: '1px solid #DDD', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                ← Voltar
              </button>
            </div>
            {formulario}
          </>
        )}

      </div>
    </div>
  )
}

export default Dashboard