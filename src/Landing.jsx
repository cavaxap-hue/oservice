import { useState, useEffect } from 'react'
import { cores } from './cores'

const ETAPAS = [
  { n: '01', label: 'Recebido', cor: '#7B8492' },
  { n: '02', label: 'Orçamento', cor: '#9B82EA' },
  { n: '03', label: 'Aguardando aprovação', cor: '#E8C468' },
  { n: '04', label: 'Em reparo', cor: '#4E9EE0' },
  { n: '05', label: 'Pronto', cor: '#35C9AE' },
  { n: '06', label: 'Entregue', cor: '#5FD68A' },
]

const RECURSOS = [
  { icone: '🎫', titulo: 'Ordens de serviço completas', desc: 'Peças e mão de obra separadas, horário de atendimento e cálculo automático de valores. Tudo o que hoje vive numa etiqueta de papel, organizado num só lugar.', destaque: true },
  { icone: '🗂️', titulo: 'Clientes e histórico', desc: 'Cada aparelho, cada conserto, ligado ao cliente certo — sem precisar procurar em cadernos ou planilhas soltas.' },
  { icone: '🔐', titulo: 'Cofre de acessos por cliente', desc: 'Senha de Wi-Fi, acesso de NVR, dados de rede — guardados em pastas por cliente, prontos quando você precisar.' },
  { icone: '📈', titulo: 'Faturamento e relatórios', desc: 'Ticket médio, equipamentos mais atendidos e os clientes que mais geram receita, sempre à mão.' },
]

function useEntrada() {
  const [visivel, setVisivel] = useState(false)
  useEffect(() => { const id = requestAnimationFrame(() => setVisivel(true)); return () => cancelAnimationFrame(id) }, [])
  return visivel
}

function TicketOS() {
  const [etapaAtiva, setEtapaAtiva] = useState(3)
  useEffect(() => {
    const id = setInterval(() => setEtapaAtiva(e => (e + 1) % ETAPAS.length), 2600)
    return () => clearInterval(id)
  }, [])
  const etapa = ETAPAS[etapaAtiva]

  return (
    <div style={{
      position: 'relative', background: cores.superficie, border: `1px solid ${cores.bordaForte}`,
      borderRadius: 20, padding: '28px 26px 24px', width: 320, maxWidth: '100%',
      boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
    }}>
      <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', width: 28, height: 28, borderRadius: '50%', background: cores.bg, border: `1px solid ${cores.bordaForte}` }} />
      <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: cores.bg, border: `1px solid ${cores.bordaForte}` }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.12em', color: cores.textoFraco }}>ORDEM DE SERVIÇO</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: cores.azulClaro, fontWeight: 600 }}>Nº 0184</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: cores.texto, fontSize: 16, fontWeight: 600, marginBottom: 3 }}>Notebook Dell Inspiron 15</div>
        <div style={{ color: cores.textoFraco, fontSize: 13 }}>Maria Fernandes · (49) 99911-2233</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: etapa.cor, boxShadow: `0 0 0 4px ${etapa.cor}22`, transition: 'background 0.4s' }} />
        <span key={etapaAtiva} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: cores.texto, animation: 'supra-fade 0.5s ease' }}>{etapa.label}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px dashed ${cores.bordaForte}` }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: cores.textoFraco, letterSpacing: '0.08em' }}>PEÇAS + SERVIÇO</div>
          <div style={{ color: cores.texto, fontSize: 15, fontWeight: 600 }}>R$ 340,00</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: cores.textoFraco, letterSpacing: '0.08em' }}>ATENDIMENTO</div>
          <div style={{ color: cores.texto, fontSize: 15, fontWeight: 600 }}>1h 40min</div>
        </div>
      </div>
    </div>
  )
}

function Landing({ onEntrar, onAssinar }) {
  const visivel = useEntrada()

  const gradienteBotao = `linear-gradient(135deg, ${cores.azulEscuro}, ${cores.azul})`

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: cores.bg, backgroundImage: cores.bgGradiente, color: cores.texto, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes supra-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .supra-cta { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
        .supra-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(59,158,255,0.38); }
        .supra-cta-outline:hover { background: rgba(255,255,255,0.06) !important; }
        .supra-card { transition: transform 0.2s ease, border-color 0.2s ease; }
        .supra-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.2); }
        @media (max-width: 480px) {
          .supra-topo-btn { padding: 8px 12px !important; font-size: 13px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .supra-cta, .supra-cta:hover, .supra-card, .supra-card:hover { transition: none !important; transform: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, padding: '22px 32px', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: gradienteBotao, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#ffffff', fontSize: 15 }}>S</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18 }}>Supradesk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onEntrar} className="supra-cta-outline supra-topo-btn" style={{ background: 'transparent', border: `1px solid ${cores.bordaForte}`, color: cores.textoSuave, padding: '9px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
            Já sou cliente
          </button>
          <button onClick={onAssinar} className="supra-cta supra-topo-btn" style={{ background: gradienteBotao, color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 700, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
            Experimentar grátis
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '56px 32px 90px', display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 440px', opacity: visivel ? 1 : 0, transform: visivel ? 'none' : 'translateY(18px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,158,255,0.10)', border: '1px solid rgba(59,158,255,0.28)', borderRadius: 20, padding: '6px 14px', marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cores.teal }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: cores.azulClaro, letterSpacing: '0.04em' }}>Feito para assistências técnicas</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, fontWeight: 600, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
            Cada aparelho tem uma etiqueta.<br />Agora ela é <span style={{ color: cores.azulClaro }}>digital</span>.
          </h1>
          <p style={{ color: cores.textoSuave, fontSize: 17, lineHeight: 1.65, marginBottom: 32, maxWidth: 480 }}>
            O Supradesk organiza ordens de serviço, clientes, senhas de acesso e faturamento da sua assistência técnica — automatizado, na nuvem, sem planilha e sem papel perdido no balcão.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={onAssinar} className="supra-cta" style={{ background: gradienteBotao, color: '#ffffff', border: 'none', padding: '15px 30px', borderRadius: 10, fontSize: 15, cursor: 'pointer', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
              Experimentar grátis
            </button>
            <span style={{ color: cores.textoFraco, fontSize: 13 }}>Cancele quando quiser · sem taxa de adesão</span>
          </div>
        </div>

        <div style={{ flex: '0 1 380px', display: 'flex', justifyContent: 'center', opacity: visivel ? 1 : 0, transform: visivel ? 'none' : 'translateY(24px)', transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s' }}>
          <TicketOS />
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${cores.borda}`, borderBottom: `1px solid ${cores.borda}`, padding: '36px 32px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: cores.textoFraco, marginBottom: 20, textTransform: 'uppercase' }}>O caminho de cada OS, do início ao fim</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ETAPAS.map((e, i) => (
              <div key={e.n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 140px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: e.cor, border: `1px solid ${e.cor}55`, borderRadius: 6, padding: '3px 7px' }}>{e.n}</span>
                  <span style={{ fontSize: 13, color: cores.textoSuave, whiteSpace: 'nowrap' }}>{e.label}</span>
                </div>
                {i < ETAPAS.length - 1 && <div style={{ flex: 1, height: 1, background: cores.borda, minWidth: 14 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '80px 32px' }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>Tudo que o balcão precisa, num só lugar</h2>
        <p style={{ color: cores.textoFraco, fontSize: 15, textAlign: 'center', marginBottom: 48, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>Sem mensalidade de R$150 a R$300 dos sistemas tradicionais.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {RECURSOS.map((r, i) => (
            <div key={i} className="supra-card" style={{
              position: 'relative', background: cores.superficie, border: `1px solid ${cores.borda}`, borderRadius: 16,
              padding: '26px 24px', gridColumn: r.destaque ? 'span 2' : 'span 1',
            }}>
              <div style={{ position: 'absolute', top: 18, right: 18, width: 6, height: 6, borderRadius: '50%', background: cores.bg, border: `1px solid ${cores.bordaForte}` }} />
              <div style={{ fontSize: 26, marginBottom: 14 }}>{r.icone}</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{r.titulo}</h3>
              <p style={{ color: cores.textoFraco, fontSize: 13.5, lineHeight: 1.65, margin: 0, maxWidth: r.destaque ? 480 : 'none' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 32px 96px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', background: cores.superficieAlta, border: `1px solid ${cores.bordaForte}`, borderRadius: 18, padding: '38px 44px', textAlign: 'center', maxWidth: 340, width: '100%' }}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, borderRadius: '50%', background: cores.bg, border: `1px solid ${cores.bordaForte}` }} />
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.1em', color: cores.textoFraco, marginBottom: 14, textTransform: 'uppercase' }}>Plano único</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, color: cores.textoSuave }}>R$</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 52, fontWeight: 700, color: cores.azulClaro }}>39</span>
            <span style={{ color: cores.textoFraco, fontSize: 14 }}>/mês</span>
          </div>
          <p style={{ color: cores.textoFraco, fontSize: 13, marginBottom: 26 }}>Todos os recursos incluídos. Sem letra miúda.</p>
          <button onClick={onAssinar} className="supra-cta" style={{ width: '100%', background: gradienteBotao, color: '#ffffff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, cursor: 'pointer', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
            Experimentar grátis
          </button>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${cores.borda}`, padding: '24px 32px', textAlign: 'center', color: cores.textoFraco, fontSize: 12 }}>
        Supradesk © {new Date().getFullYear()} — sistema de gestão para assistências técnicas
      </div>

    </div>
  )
}

export default Landing
