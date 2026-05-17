import { useState } from 'react'
import Dashboard from './Dashboard'

function Login({ onEntrar }) {
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #E0E0E0', width: '100%', maxWidth: '380px' }}>

        <h1 style={{ fontSize: '26px', color: '#185FA5', textAlign: 'center', marginBottom: '4px' }}>OService</h1>
        <p style={{ color: '#999', textAlign: 'center', fontSize: '13px', marginBottom: '32px' }}>Gestão de Ordens de Serviço</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>E-mail</label>
          <input type="email" placeholder="seu@email.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Senha</label>
          <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
        </div>

        <button onClick={onEntrar} style={{ width: '100%', background: '#185FA5', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' }}>
          Entrar
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '20px' }}>
          Esqueceu a senha? <span style={{ color: '#185FA5', cursor: 'pointer' }}>Recuperar acesso</span>
        </p>

      </div>
    </div>
  )
}

function App() {
  const [tela, setTela] = useState('login')

  if (tela === 'dashboard') return <Dashboard />
  return <Login onEntrar={() => setTela('dashboard')} />
}

export default App