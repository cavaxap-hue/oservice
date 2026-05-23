import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Dashboard from './Dashboard'
import Logo from './Logo'
import { useTema } from './theme'

function Login({ t, modo, alternar }) {
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
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

      <button onClick={alternar} style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 7, background: t.card, border: `1px solid ${t.borda}`, color: t.textoSuave, padding: '8px 13px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
        {modo === 'dark' ? '☀️ Tema claro' : '🌙 Tema escuro'}
      </button>

      <div style={{ background: t.card, padding: '40px', borderRadius: 16, border: `1px solid ${t.cardBorda}`, width: '100%', maxWidth: 400 }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Logo modo={modo} tamanho={0.85} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6 }}>E-mail</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com" style={{ width: '100%', padding: '11px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6 }}>Senha</label>
          <input value={senha} onChange={e => setSenha(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && entrar()} style={{ width: '100%', padding: '11px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto }} />
        </div>

        {erro && <p style={{ color: '#E24B4A', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{erro}</p>}

        <button onClick={entrar} disabled={carregando} style={{ width: '100%', background: carregando ? t.textoFraco : t.azul, color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontSize: 15, cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

      </div>
    </div>
  )
}

function App() {
  const { t, modo, alternar } = useTema()
  const [sessao, setSessao] = useState(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session)
      setVerificando(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (verificando) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: t.textoFraco, background: t.bg }}>Carregando...</div>

  if (!sessao) return <Login t={t} modo={modo} alternar={alternar} />
  return <Dashboard onSair={() => supabase.auth.signOut()} t={t} modo={modo} alternar={alternar} sessao={sessao} />
}

export default App
