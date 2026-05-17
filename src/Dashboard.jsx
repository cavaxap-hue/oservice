import { useState } from 'react'

function Dashboard() {
  const [tela, setTela] = useState('lista')

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4F6F9', display: 'flex' }}>
      
      {/* Sidebar */}
      <div style={{ width: '220px', background: '#fff', borderRight: '1px solid #E0E0E0', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #E0E0E0', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', color: '#185FA5', margin: 0 }}>OService</h2>
          <small style={{ color: '#999', fontSize: '12px' }}>Painel principal</small>
        </div>
        <div onClick={() => setTela('lista')} style={{ padding: '8px 20px', fontSize: '14px', color: tela === 'lista' ? '#185FA5' : '#666', fontWeight: tela === 'lista' ? '500' : 'normal', background: tela === 'lista' ? '#EEF4FB' : 'transparent', borderRight: tela === 'lista' ? '3px solid #185FA5' : 'none', cursor: 'pointer' }}>📋 Ordens de Serviço</div>
        <div style={{ padding: '8px 20px', fontSize: '14px', color: '#666', cursor: 'pointer' }}>👥 Clientes</div>
        <div style={{ padding: '8px 20px', fontSize: '14px', color: '#666', cursor: 'pointer' }}>📊 Relatórios</div>
        <div style={{ padding: '8px 20px', fontSize: '14px', color: '#666', cursor: 'pointer' }}>⚙️ Configurações</div>
      </div>

      {/* Conteudo principal */}
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
                { label: 'Total abertas', valor: '24', cor: '#185FA5' },
                { label: 'Em reparo', valor: '8', cor: '#E6A817' },
                { label: 'Prontas', valor: '5', cor: '#2E9E52' },
                { label: 'Atrasadas', valor: '2', cor: '#E63946' },
              ].map((card) => (
                <div key={card.label} style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #E0E0E0' }}>
                  <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px' }}>{card.label}</p>
                  <p style={{ fontSize: '28px', fontWeight: '600', color: card.cor, margin: 0 }}>{card.valor}</p>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E0E0E0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>OS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Cliente</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Equipamento</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#999', fontWeight: '500', fontSize: '12px' }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { num: '#0051', cliente: 'João Silva', equip: 'Notebook Dell', status: 'Em reparo', cor: '#185FA5', bg: '#EEF4FB', data: '12/05' },
                    { num: '#0050', cliente: 'Maria Souza', equip: 'Nobreak APC', status: 'Pronto', cor: '#2E9E52', bg: '#E8F5EE', data: '11/05' },
                    { num: '#0049', cliente: 'Carlos Mendes', equip: 'Notebook HP', status: 'Aguardando', cor: '#E6A817', bg: '#FEF6E4', data: '10/05' },
                    { num: '#0048', cliente: 'Ana Paula', equip: 'Placa-mãe Asus', status: 'Em reparo', cor: '#185FA5', bg: '#EEF4FB', data: '09/05' },
                  ].map((os) => (
                    <tr key={os.num} style={{ borderTop: '1px solid #F0F0F0' }}>
                      <td style={{ padding: '14px 16px', color: '#999', fontFamily: 'monospace' }}>{os.num}</td>
                      <td style={{ padding: '14px 16px', color: '#333', fontWeight: '500' }}>{os.cliente}</td>
                      <td style={{ padding: '14px 16px', color: '#666' }}>{os.equip}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: os.bg, color: os.cor, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                          {os.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#999' }}>{os.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <input type="text" placeholder="Ex: João Silva" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Telefone / WhatsApp</label>
                  <input type="text" placeholder="(49) 99999-0000" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>

              <p style={{ fontSize: '12px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', marginTop: '24px' }}>Equipamento</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Tipo</label>
                  <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none', background: '#fff' }}>
                    <option>Notebook</option>
                    <option>Nobreak</option>
                    <option>Placa-mãe</option>
                    <option>Desktop</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Marca / Modelo</label>
                  <input type="text" placeholder="Ex: Dell Inspiron 15" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Problema relatado</label>
                <textarea placeholder="Descreva o que o cliente relatou..." rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setTela('lista')} style={{ background: '#fff', color: '#666', border: '1px solid #DDD', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={() => setTela('lista')} style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
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