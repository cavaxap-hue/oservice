import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Dashboard from './Dashboard'

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar() {
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setCarregando(false)
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #E0E0E0', width: '100%', maxWidth: '380px' }}>

        <h1 style={{ fontSize: '26px', color: '#185FA5', textAlign: 'center', marginBottom: '4px' }}>OService</h1>
        <p style={{ color: '#999', textAlign: 'center', fontSize: '13px', marginBottom: '32px' }}>Gestão de Ordens de Serviço</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>E-mail</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>Senha</label>
          <input value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && entrar()} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '14px', outline: 'none' }} />
        </div>

        {erro && <p style={{ color: '#E63946', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{erro}</p>}

        <button onClick={entrar} disabled={carregando} style={{ width: '100%', background: carregando ? '#999' : '#185FA5', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '15px', cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

      </div>
    </div>
  )
}

function App() {
  const [sessao, setSessao] = useState(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session)
      setVerificando(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
    })
  }, [])

  if (verificando) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#999' }}>Carregando...</div>

  if (!sessao) return <Login />
  return <Dashboard onSair={() => supabase.auth.signOut()} />
}

export default App