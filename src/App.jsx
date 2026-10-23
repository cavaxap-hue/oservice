import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Dashboard from './Dashboard'
import Logo from './Logo'
import Landing from './Landing'
import { cores } from './cores'
import { useTema } from './theme'
import { iniciarCheckout, abrirPortal } from './assinatura'

// Depoimentos reais de clientes: { texto, nome, empresa, cidade }. A seção só aparece com itens.
const DEPOIMENTOS = []

const FUNCIONALIDADES = [
  { icone: '🎫', texto: 'Ordens de serviço com peças, serviço e horário' },
  { icone: '🗂️', texto: 'Cadastro de clientes e histórico' },
  { icone: '🗓️', texto: 'Preventivas com alertas por data e relatório em PDF' },
  { icone: '🔐', texto: 'Cofre de senhas e anotações por cliente' },
  { icone: '📈', texto: 'Relatórios de faturamento' },
  { icone: '🧾', texto: 'PDF da OS com a logo da sua empresa' },
]

const CONDICOES_TESTE = [
  '7 dias grátis para testar tudo',
  'Depois, R$ 39/mês no cartão',
  'Cancele quando quiser antes do fim do teste e não paga nada',
  'Pedimos o cartão agora, a primeira cobrança só acontece após 7 dias',
]

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

const STATUS_LIBERADOS = ['trial', 'ativa']
const TOLERANCIA_MS = 3 * 24 * 60 * 60 * 1000

// Validade nula = sem limite (empresas criadas manualmente)
function acessoLiberado(assinatura) {
  if (!assinatura || !STATUS_LIBERADOS.includes(assinatura.status)) return false
  if (!assinatura.validaAte) return true
  return new Date(assinatura.validaAte).getTime() + TOLERANCIA_MS > Date.now()
}

function limparParametrosAssinatura() {
  window.history.replaceState(null, '', window.location.pathname)
}

function MarcaSupradesk() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${cores.azulEscuro}, ${cores.azul})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#ffffff', fontSize: 15 }}>S</div>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: cores.texto }}>Supradesk</span>
    </div>
  )
}

function Cadastro({ onVoltar, onEntrar }) {
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [contaCriada, setContaCriada] = useState(null) // { email, empresaId } — permite tentar o pagamento de novo sem recriar a conta

  const senhasDiferentes = confirmar && senha !== confirmar
  const inputStyle = { width: '100%', padding: '12px 13px', borderRadius: 9, border: `1px solid ${cores.bordaForte}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: cores.bg, color: cores.texto, fontFamily: "'Inter', sans-serif", opacity: contaCriada ? 0.6 : 1 }
  const labelStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: cores.textoFraco, display: 'block', marginBottom: 7 }
  const voltarStyle = { background: 'transparent', border: 'none', color: cores.textoFraco, fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif", padding: 0 }

  async function continuar() {
    setErro('')
    let conta = contaCriada
    if (!conta) {
      const emailNormalizado = email.trim().toLowerCase()
      if (!empresa.trim()) { setErro('Informe o nome da empresa.'); return }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) { setErro('Informe um e-mail válido.'); return }
      if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
      if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }

      setCarregando(true)
      try {
        const resp = await fetch('/api/criar-conta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empresa: empresa.trim(), email: emailNormalizado, senha }),
        })
        const data = await resp.json().catch(() => ({}))
        if (!resp.ok) { setErro(data.error || 'Não foi possível criar a conta.'); setCarregando(false); return }

        const { error } = await supabase.auth.signInWithPassword({ email: emailNormalizado, password: senha })
        if (error) { setErro('Conta criada, mas não foi possível entrar. Use "Já sou cliente" para continuar.'); setCarregando(false); return }

        conta = { email: emailNormalizado, empresaId: data.empresa_id }
        setContaCriada(conta)
      } catch {
        setErro('Erro de conexão. Tente novamente.')
        setCarregando(false)
        return
      }
    }

    setCarregando(true)
    try {
      await iniciarCheckout()
    } catch (e) {
      setErro(`Conta criada! ${e.message} Clique em continuar para tentar de novo.`)
      setCarregando(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: cores.bg, color: cores.texto, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .cad-grid { display: flex; flex-direction: row-reverse; min-height: 100vh; }
        .cad-form-col { flex: 0 0 45%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 40px; box-sizing: border-box; }
        .cad-apres { flex: 0 0 55%; padding: 32px 56px 56px; box-sizing: border-box; border-right: 1px solid ${cores.borda}; }
        .cad-topo-mobile { display: none; }
        .cad-input:focus { border-color: ${cores.azul} !important; }
        .cad-cta { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .cad-cta:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(59,158,255,0.38); }
        @media (max-width: 900px) {
          .cad-grid { flex-direction: column; }
          .cad-form-col, .cad-apres { flex: none; width: 100%; }
          .cad-form-col { padding: 20px 16px 40px; }
          .cad-apres { padding: 40px 16px 56px; border-right: none; border-top: 1px solid ${cores.borda}; }
          .cad-topo-mobile { display: flex; }
          .cad-topo-desktop { display: none !important; }
          .cad-card { padding: 28px 20px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cad-cta, .cad-cta:hover { transition: none !important; transform: none !important; }
        }
      `}</style>

      <div className="cad-grid">

        {/* Coluna direita no desktop, primeira no celular */}
        <div className="cad-form-col">
          <div className="cad-topo-mobile" style={{ width: '100%', maxWidth: 420, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <MarcaSupradesk />
            <button onClick={onVoltar} style={voltarStyle}>← Voltar</button>
          </div>

          <div className="cad-card" style={{ background: cores.superficieAlta, border: `1px solid ${cores.bordaForte}`, borderRadius: 18, padding: '36px 32px', width: '100%', maxWidth: 420, boxSizing: 'border-box' }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 600, margin: '0 0 24px' }}>Crie sua conta</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nome da empresa</label>
              <input className="cad-input" value={empresa} onChange={e => setEmpresa(e.target.value)} disabled={!!contaCriada} placeholder="Sua assistência técnica" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>E-mail</label>
              <input className="cad-input" value={email} onChange={e => setEmail(e.target.value)} disabled={!!contaCriada} type="email" placeholder="seu@email.com" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Senha</label>
              <input className="cad-input" value={senha} onChange={e => setSenha(e.target.value)} disabled={!!contaCriada} type="password" placeholder="Mínimo 6 caracteres" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Confirmar senha</label>
              <input className="cad-input" value={confirmar} onChange={e => setConfirmar(e.target.value)} disabled={!!contaCriada} type="password" placeholder="Repita a senha" onKeyDown={e => e.key === 'Enter' && continuar()} style={{ ...inputStyle, border: `1px solid ${senhasDiferentes ? '#E8687A' : cores.bordaForte}` }} />
              {senhasDiferentes && (
                <p style={{ color: '#E8687A', fontSize: 12, margin: '5px 0 0' }}>As senhas não coincidem</p>
              )}
            </div>

            <div style={{ border: `1px dashed ${cores.bordaForte}`, borderRadius: 10, padding: '14px 16px', marginBottom: 22 }}>
              {CONDICOES_TESTE.map(item => (
                <div key={item} style={{ display: 'flex', gap: 9, fontSize: 13, color: cores.textoSuave, lineHeight: 1.5, marginBottom: 5 }}>
                  <span style={{ color: cores.teal, fontWeight: 700 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {erro && <p style={{ color: '#E8687A', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{erro}</p>}

            <button onClick={continuar} disabled={carregando} className="cad-cta" style={{ width: '100%', background: `linear-gradient(135deg, ${cores.azulEscuro}, ${cores.azul})`, opacity: carregando ? 0.6 : 1, color: '#ffffff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
              {carregando ? 'Aguarde...' : 'Continuar para o pagamento'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: cores.textoFraco, margin: '18px 0 0' }}>
              Já tem conta?{' '}
              <button onClick={onEntrar} style={{ background: 'transparent', border: 'none', color: cores.azulClaro, fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: "'Inter', sans-serif" }}>Entrar</button>
            </p>
          </div>
        </div>

        {/* Coluna esquerda no desktop, embaixo no celular */}
        <div className="cad-apres" style={{ backgroundImage: cores.bgGradiente }}>
          <div className="cad-topo-desktop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 56 }}>
            <MarcaSupradesk />
            <button onClick={onVoltar} style={voltarStyle}>← Voltar</button>
          </div>

          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 600, lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Teste o Supradesk <span style={{ color: cores.azulClaro }}>grátis por 7 dias</span>
          </h1>
          <p style={{ color: cores.textoSuave, fontSize: 16, lineHeight: 1.65, margin: '0 0 32px', maxWidth: 520 }}>
            Organize sua assistência técnica num só lugar, sem papel perdido no balcão e sem planilha.
          </p>

          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: cores.textoFraco, textTransform: 'uppercase', margin: '0 0 14px' }}>O que está incluído</p>
          <div style={{ display: 'grid', gap: 10, marginBottom: 32 }}>
            {FUNCIONALIDADES.map(f => (
              <div key={f.texto} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: cores.superficie, border: `1px solid ${cores.borda}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{f.icone}</span>
                <span style={{ fontSize: 14, color: cores.texto }}>{f.texto}</span>
              </div>
            ))}
          </div>

          <div style={{ background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: 14, padding: '20px 22px', marginBottom: 16, maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, color: cores.azulClaro }}>R$ 39/mês</span>
              <span style={{ color: cores.textoSuave, fontSize: 14 }}>depois do teste</span>
            </div>
            <p style={{ color: cores.textoFraco, fontSize: 13, margin: '6px 0 0' }}>Sistemas tradicionais cobram de R$ 150 a R$ 300/mês</p>
          </div>

          <div style={{ borderLeft: `2px solid ${cores.teal}`, padding: '4px 0 4px 16px', maxWidth: 520, marginBottom: DEPOIMENTOS.length ? 36 : 0 }}>
            <p style={{ color: cores.textoSuave, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Feito por um técnico com mais de 15 anos de bancada, para quem vive o balcão da assistência.
            </p>
          </div>

          {DEPOIMENTOS.length > 0 && (
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: cores.textoFraco, textTransform: 'uppercase', margin: '0 0 14px' }}>Quem já usa</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {DEPOIMENTOS.map(d => (
                  <figure key={`${d.nome}-${d.empresa}`} style={{ margin: 0, background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: 14, padding: '18px 20px' }}>
                    <blockquote style={{ margin: 0, color: cores.texto, fontSize: 14, lineHeight: 1.6 }}>“{d.texto}”</blockquote>
                    <figcaption style={{ marginTop: 10, fontSize: 12, color: cores.textoFraco }}>
                      <strong style={{ color: cores.textoSuave }}>{d.nome}</strong> · {d.empresa} · {d.cidade}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function AtivandoConta({ t, modo }) {
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: t.card, padding: 40, borderRadius: 16, border: `1px solid ${t.cardBorda}`, maxWidth: 400, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo modo={modo} tamanho={0.7} />
        </div>
        <h2 style={{ color: t.texto, fontSize: 20, fontWeight: '500', marginBottom: 8 }}>Ativando sua conta...</h2>
        <p style={{ color: t.textoFraco, fontSize: 14 }}>Estamos confirmando seu pagamento. Isso leva só alguns segundos.</p>
      </div>
    </div>
  )
}

// trial/ativa só chegam aqui com a validade vencida (além da tolerância): mesmo caso de cobrança falha
const BLOQUEIOS = {
  pendente: { titulo: 'Assinatura pendente', texto: 'Falta cadastrar o pagamento para começar seus 7 dias grátis.', botao: 'Concluir assinatura', acao: iniciarCheckout },
  inadimplente: { titulo: 'Pagamento não aprovado', texto: 'Não conseguimos cobrar seu cartão. Atualize a forma de pagamento para voltar a usar.', botao: 'Atualizar cartão', acao: abrirPortal },
  cancelada: { titulo: 'Assinatura cancelada', texto: 'Sua assinatura foi cancelada. Seus dados continuam guardados.', botao: 'Assinar novamente', acao: iniciarCheckout },
}
BLOQUEIOS.trial = BLOQUEIOS.inadimplente
BLOQUEIOS.ativa = BLOQUEIOS.inadimplente

function AssinaturaBloqueada({ t, status, aviso }) {
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const bloqueio = BLOQUEIOS[status] || BLOQUEIOS.pendente

  async function executar() {
    setErro('')
    setCarregando(true)
    try {
      await bloqueio.acao()
    } catch (e) {
      setErro(e.message)
      setCarregando(false)
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: t.card, padding: 40, borderRadius: 16, border: `1px solid ${t.cardBorda}`, maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
        <h2 style={{ color: t.texto, marginBottom: 12 }}>{bloqueio.titulo}</h2>
        <p style={{ color: t.textoFraco, fontSize: 14 }}>
          {aviso
            ? 'Ainda não recebemos a confirmação do pagamento. Se você acabou de pagar, aguarde alguns instantes e recarregue a página.'
            : bloqueio.texto}
        </p>
        {erro && <p style={{ color: '#E24B4A', fontSize: 13, marginTop: 16 }}>{erro}</p>}
        <button onClick={executar} disabled={carregando} style={{ marginTop: 24, width: '100%', background: carregando ? t.textoFraco : t.azul, color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontSize: 15, cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
          {carregando ? 'Abrindo...' : bloqueio.botao}
        </button>
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 12, background: 'transparent', border: 'none', color: t.textoFraco, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>Sair</button>
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
  const [mostrarCadastro, setMostrarCadastro] = useState(false)
  const [assinatura, setAssinatura] = useState(null) // { status, validaAte }
  const [ativando, setAtivando] = useState(false)
  const [avisoAtivacao, setAvisoAtivacao] = useState(false)
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
      else { setEmpresaId(null); setAssinatura(null); setVerificando(false) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Volta do Stripe: espera o webhook liberar a empresa (a cada 2s, até ~40s)
  useEffect(() => {
    if (!ativando || !empresaId) return
    let tentativas = 0
    const id = setInterval(async () => {
      tentativas++
      const atual = await buscarAssinatura(empresaId)
      if (acessoLiberado(atual)) {
        clearInterval(id)
        setAssinatura(atual)
        setAtivando(false)
        limparParametrosAssinatura()
      } else if (tentativas >= 20) {
        clearInterval(id)
        setAtivando(false)
        setAvisoAtivacao(true)
        limparParametrosAssinatura()
      }
    }, 2000)
    return () => clearInterval(id)
  }, [ativando, empresaId])

  async function buscarAssinatura(idEmpresa) {
    const { data, error } = await supabase
      .from('empresas')
      .select('status_assinatura, assinatura_valida_ate')
      .eq('id', idEmpresa)
      .maybeSingle()
    if (error) console.error('Erro ao buscar status da assinatura:', error)
    return { status: data?.status_assinatura || null, validaAte: data?.assinatura_valida_ate || null }
  }

  async function buscarEmpresa(userId) {
    setBuscandoEmpresa(true)
    const { data } = await supabase
      .from('usuario_empresa')
      .select('empresa_id')
      .eq('user_id', userId)
      .single()
    const idEmpresa = data?.empresa_id || null
    const atual = idEmpresa ? await buscarAssinatura(idEmpresa) : null
    setEmpresaId(idEmpresa)
    setAssinatura(atual)

    const retornoStripe = new URLSearchParams(window.location.search).get('assinatura')
    if (retornoStripe === 'sucesso' && idEmpresa && !acessoLiberado(atual)) setAtivando(true)
    else if (retornoStripe) limparParametrosAssinatura()

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

  // Fica no cadastro mesmo depois do login automático, até redirecionar pro Stripe
  if (mostrarCadastro) return <Cadastro onVoltar={() => setMostrarCadastro(false)} onEntrar={() => { setMostrarCadastro(false); setMostrarLogin(true) }} />

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
    return <Landing onEntrar={() => setMostrarLogin(true)} onAssinar={() => setMostrarCadastro(true)} />
  }
  if (!empresaId) return <SemEmpresa t={t} />
  if (ativando) return <AtivandoConta t={t} modo={modo} />
  if (!acessoLiberado(assinatura)) return <AssinaturaBloqueada t={t} status={assinatura?.status} aviso={avisoAtivacao} />
  return <Dashboard onSair={() => supabase.auth.signOut()} t={t} modo={modo} alternar={alternar} sessao={sessao} empresaId={empresaId} />
}

export default App
