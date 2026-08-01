import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Dashboard from './Dashboard'
import Logo from './Logo'
import Landing from './Landing'
import { useTema } from './theme'

function Login({ t, modo, alternar, onVoltar }) {
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

  async function recuperarSenha() {
    if (!email) { setErro('Digite seu e-mail primeiro.'); return }
    setCarregando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) error.status === 429 ? setErro('Muitas tentativas. Aguarde 1 minuto.') : setErro('Erro ao enviar e-mail. Verifique o endereço.')
    else setErro('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
    setCarregando(false)
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

      <button onClick={onVoltar} style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: t.textoFraco, fontSize: 13, cursor: 'pointer' }}>
        ← Voltar
      </button>

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

        {erro && <p style={{ color: erro.includes('enviado') ? '#1D9E75' : '#E24B4A', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{erro}</p>}

        <button onClick={entrar} disabled={carregando} style={{ width: '100%', background: carregando ? t.textoFraco : t.azul, color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontSize: 15, cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={recuperarSenha} style={{ background: 'transparent', border: 'none', color: t.textoFraco, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            Esqueci minha senha
          </button>
        </div>

      </div>
    </div>
  )
}

function SemEmpresa({ t }) {
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: t.card, padding: 40, borderRadius: 16, border: `1px solid ${t.cardBorda}`, maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: t.texto, marginBottom: 12 }}>Empresa não encontrada</h2>
        <p style={{ color: t.textoFraco, fontSize: 14 }}>Sua conta não está vinculada a nenhuma empresa. Entre em contato com o suporte do Supradesk.</p>
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 24, background: t.azul, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Sair</button>
      </div>
    </div>
  )
}

function App() {
  const { t, modo, alternar } = useTema()
  const [sessao, setSessao] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [empresaId, setEmpresaId] = useState(null)
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false)
  const [recuperando, setRecuperando] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [novaSenhaMsg, setNovaSenhaMsg] = useState('')
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const veioDeRecovery = typeof window !== 'undefined' && window.location.hash.includes('type=recovery')

  useEffect(() => {
    document.body.style.background = t.bg
    document.body.style.margin = '0'
  }, [t.bg])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session)
      if (session) buscarEmpresa(session.user.id)
      else setVerificando(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY' || (session && veioDeRecovery)) {
        setRecuperando(true)
        setSessao(session)
        setVerificando(false)
        return
      }
      setSessao(session)
      if (session) buscarEmpresa(session.user.id)
      else { setEmpresaId(null); setVerificando(false) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function buscarEmpresa(userId) {
    setBuscandoEmpresa(true)
    const { data } = await supabase
      .from('usuario_empresa')
      .select('empresa_id')
      .eq('user_id', userId)
      .single()
    setEmpresaId(data?.empresa_id || null)
    setBuscandoEmpresa(false)
    setVerificando(false)
  }

  async function salvarNovaSenha() {
    if (!novaSenha || novaSenha.length < 6) { setNovaSenhaMsg('A senha deve ter pelo menos 6 caracteres.'); return }
    if (novaSenha !== confirmarSenha) { setNovaSenhaMsg('As senhas não coincidem. Verifique e tente novamente.'); return }
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      if (error.message.includes('same password') || error.message.includes('different'))
        setNovaSenhaMsg('A nova senha não pode ser igual à anterior.')
      else setNovaSenhaMsg('Erro ao salvar. Tente novamente.')
    }
    else {
      setNovaSenhaMsg('Senha alterada com sucesso!')
      setRecuperando(false)
      buscarEmpresa(sessao.user.id)
    }
  }

  if (verificando || buscandoEmpresa) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: t.textoFraco, background: t.bg }}>
      Carregando...
    </div>
  )

  if (recuperando) return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: t.card, padding: 40, borderRadius: 16, border: `1px solid ${t.cardBorda}`, width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo modo={modo} tamanho={0.7} />
        </div>
        <h2 style={{ color: t.texto, fontSize: 20, fontWeight: '500', marginBottom: 8, textAlign: 'center' }}>Bem-vindo ao Supradesk!</h2>
        <p style={{ color: t.textoFraco, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Defina sua senha de acesso para continuar</p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6 }}>Nova senha</label>
          <input value={novaSenha} onChange={e => setNovaSenha(e.target.value)} type="password" placeholder="Mínimo 6 caracteres" style={{ width: '100%', padding: '11px 12px', borderRadius: 8, border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6 }}>Confirmar nova senha</label>
          <input value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} type="password" placeholder="Repita a nova senha" onKeyDown={e => e.key === 'Enter' && salvarNovaSenha()} style={{ width: '100%', padding: '11px 12px', borderRadius: 8, border: `1px solid ${confirmarSenha && novaSenha !== confirmarSenha ? '#E24B4A' : t.inputBorda}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: t.inputBg, color: t.texto }} />
          {confirmarSenha && novaSenha !== confirmarSenha && (
            <p style={{ color: '#E24B4A', fontSize: 12, margin: '4px 0 0' }}>As senhas não coincidem</p>
          )}
        </div>
        {novaSenhaMsg && <p style={{ color: novaSenhaMsg.includes('sucesso') ? '#1D9E75' : '#E24B4A', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{novaSenhaMsg}</p>}
        <button onClick={salvarNovaSenha} style={{ width: '100%', background: t.azul, color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: '500' }}>
          Criar senha e entrar
        </button>
      </div>
    </div>
  )

  if (!sessao) {
    if (mostrarLogin) return <Login t={t} modo={modo} alternar={alternar} onVoltar={() => setMostrarLogin(false)} />
    return <Landing onEntrar={() => setMostrarLogin(true)} />
  }
  if (!empresaId) return <SemEmpresa t={t} />
  return <Dashboard onSair={() => supabase.auth.signOut()} t={t} modo={modo} alternar={alternar} sessao={sessao} empresaId={empresaId} />
}

export default App
