// ============================================================
// SUPRADESK — Logo reutilizável
// Use <Logo modo="dark" /> ou <Logo modo="light" tamanho={1.2} />
// ============================================================

function Logo({ modo = 'dark', tamanho = 1, comSlogan = true }) {
  const azul = modo === 'dark' ? '#5BA3E8' : '#185FA5'
  const barra = modo === 'dark' ? '#378ADD' : '#185FA5'
  const desk = modo === 'dark' ? '#cdd6d3' : '#5a6b66'
  const slogan = modo === 'dark' ? '#7e8e89' : '#8a9a95'
  const w = 300 * tamanho
  const h = (comSlogan ? 76 : 60) * tamanho

  return (
    <svg width={w} height={h} viewBox={comSlogan ? '0 0 360 90' : '0 0 360 76'} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="14" width="6" height="62" rx="3" fill={barra} />
      <rect x="11" y="14" width="3.5" height="62" rx="1.75" fill="#9BB5D4" opacity={modo === 'dark' ? 0.5 : 0.7} />
      <rect x="26" y="14" width="60" height="62" rx="14" fill={barra} />
      <rect x="31" y="19" width="50" height="52" rx="10" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <text x="56" y="53" textAnchor="middle" fontFamily="sans-serif" fontSize="24" fontWeight="700" fill="white">S</text>
      <text x="100" y="48" fontFamily="sans-serif" fontSize="34" fontWeight="800" fill={azul}>Supra<tspan fontWeight="300" fill={desk}>desk</tspan></text>
      <rect x="100" y="58" width="208" height="2.5" rx="1.25" fill={barra} />
      {comSlogan && (
        <text x="101" y="76" fontFamily="sans-serif" fontSize="12" fill={slogan} letterSpacing="0.5">Gestão inteligente para o seu negócio</text>
      )}
    </svg>
  )
}

export default Logo
