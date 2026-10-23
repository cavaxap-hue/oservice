import { useEffect } from 'react'
import { cores } from './cores'
import { ATUALIZADO_EM } from './legal'

// Página pública de Termos de Uso / Política de Privacidade (abre sem login)
function PaginaLegal({ documento }) {
  useEffect(() => {
    document.title = `${documento.titulo} · Supradesk`
    document.body.style.background = cores.bg
    document.body.style.margin = '0'
  }, [documento])

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: cores.bg, backgroundImage: cores.bgGradiente, color: cores.texto, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .legal-voltar { transition: color 0.15s ease, border-color 0.15s ease; }
        .legal-voltar:hover { color: ${cores.texto} !important; border-color: rgba(255,255,255,0.3) !important; }
        .legal-texto a { color: ${cores.azulClaro}; }
        @media (max-width: 600px) {
          .legal-coluna { padding: 20px 16px 64px !important; }
          .legal-titulo { font-size: 28px !important; }
        }
      `}</style>

      <div className="legal-coluna" style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px 96px' }}>
        <a href="/" className="legal-voltar" style={{ display: 'inline-block', color: cores.textoSuave, border: `1px solid ${cores.bordaForte}`, borderRadius: 8, padding: '8px 14px', fontSize: 14, textDecoration: 'none', marginBottom: 40 }}>
          ← Voltar ao início
        </a>

        <h1 className="legal-titulo" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', margin: '0 0 10px' }}>
          {documento.titulo}
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.04em', color: cores.textoFraco, margin: '0 0 32px' }}>
          Última atualização: {ATUALIZADO_EM}
        </p>

        <div className="legal-texto">
          {documento.intro.map(p => (
            <p key={p} style={{ color: cores.texto, fontSize: 16, lineHeight: 1.75, margin: '0 0 16px' }}>{p}</p>
          ))}

          {documento.secoes.map(secao => (
            <section key={secao.titulo} style={{ marginTop: 40 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, lineHeight: 1.3, margin: '0 0 14px', paddingTop: 24, borderTop: `1px solid ${cores.borda}` }}>
                {secao.titulo}
              </h2>
              {secao.paragrafos.map(p => (
                <p key={p} style={{ color: cores.textoSuave, fontSize: 15.5, lineHeight: 1.75, margin: '0 0 14px', overflowWrap: 'break-word' }}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PaginaLegal
