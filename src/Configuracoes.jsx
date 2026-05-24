import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { cores } from './theme'

function Configuracoes({ t, modo }) {
  const [config, setConfig] = useState({
    nome_empresa: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    bairro: '',
    cep: '',
    site: '',
    logo_url: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [mensagem, setMensagem] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarConfig()
  }, [])

  async function carregarConfig() {
    const { data } = await supabase.from('configuracoes').select('*').limit(1).single()
    if (data) setConfig(data)
    setCarregando(false)
  }

  async function salvarConfig() {
    setSalvando(true)
    setMensagem(null)
    const { data, error } = await supabase.from('configuracoes').upsert({ ...config, id: 1 })
    if (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' })
    } else {
      setMensagem({ tipo: 'ok', texto: 'Configurações salvas com sucesso!' })
    }
    setSalvando(false)
    setTimeout(() => setMensagem(null), 3000)
  }

  async function uploadLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setMensagem({ tipo: 'erro', texto: 'Imagem muito grande. Máximo 2MB.' })
      return
    }
    setUploadando(true)
    setMensagem(null)
    const ext = file.name.split('.').pop()
    const nome = `logo_empresa_1.${ext}`
    const { error } = await supabase.storage.from('logos').upload(nome, file, { upsert: true })
    if (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao fazer upload. Tente novamente.' })
      setUploadando(false)
      return
    }
    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(nome)
    const url = urlData.publicUrl + '?t=' + Date.now()
    setConfig(prev => ({ ...prev, logo_url: url }))
    setMensagem({ tipo: 'ok', texto: 'Logo enviada! Clique em Salvar para confirmar.' })
    setUploadando(false)
  }

  function removerLogo() {
    setConfig(prev => ({ ...prev, logo_url: '' }))
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 8,
    border: `1px solid ${t.inputBorda}`,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    background: t.inputBg,
    color: t.texto,
  }
  const labelStyle = { fontSize: 13, color: t.textoSuave, display: 'block', marginBottom: 6 }
  const cardStyle = { background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 24, marginBottom: 16 }

  if (carregando) return <div style={{ color: t.textoFraco, padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ width: '100%', fontFamily: 'sans-serif', maxWidth: 620 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>Configurações</h1>
        <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>Dados da sua empresa — aparecem no PDF das OS</p>
      </div>

      {/* Logo */}
      <div style={cardStyle}>
        <p style={{ fontSize: 11, fontWeight: '600', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Logo da empresa</p>

        {config.logo_url ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ background: modo === 'dark' ? '#fff' : '#F4F6F9', borderRadius: 10, padding: 16, display: 'inline-block', marginBottom: 12 }}>
              <img src={config.logo_url} alt="Logo" style={{ maxHeight: 80, maxWidth: 240, objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={{ background: t.azul, color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: '500' }}>
                {uploadando ? 'Enviando...' : '🔄 Trocar logo'}
                <input type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} disabled={uploadando} />
              </label>
              <button onClick={removerLogo} style={{ background: 'transparent', color: cores.perigo, border: `1px solid ${cores.perigo}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                🗑 Remover
              </button>
            </div>
          </div>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, border: `2px dashed ${t.cardBorda}`, borderRadius: 10, padding: '28px 20px', cursor: uploadando ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
            <span style={{ fontSize: 32 }}>🖼️</span>
            <span style={{ color: t.textoSuave, fontSize: 14, fontWeight: '500' }}>{uploadando ? 'Enviando...' : 'Clique para fazer upload da logo'}</span>
            <span style={{ color: t.textoFraco, fontSize: 12 }}>PNG, JPG ou SVG — máximo 2MB</span>
            <input type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} disabled={uploadando} />
          </label>
        )}

        <p style={{ color: t.textoFraco, fontSize: 12, margin: 0 }}>A logo aparece no cabeçalho do PDF das OS. O sistema continua com a marca Supradesk.</p>
      </div>

      {/* Dados da empresa */}
      <div style={cardStyle}>
        <p style={{ fontSize: 11, fontWeight: '600', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' }}>Dados da empresa</p>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Nome da empresa / Razão social</label>
          <input value={config.nome_empresa} onChange={e => setConfig({ ...config, nome_empresa: e.target.value })} placeholder="Ex: Ultra Soluções Tecnológicas" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>CNPJ / CPF</label>
          <input value={config.cnpj} onChange={e => setConfig({ ...config, cnpj: e.target.value })} placeholder="00.000.000/0000-00" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Telefone / WhatsApp</label>
          <input value={config.telefone} onChange={e => setConfig({ ...config, telefone: e.target.value })} placeholder="(49) 99999-0000" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>E-mail</label>
          <input value={config.email} onChange={e => setConfig({ ...config, email: e.target.value })} type="email" placeholder="contato@suaempresa.com.br" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Site</label>
          <input value={config.site} onChange={e => setConfig({ ...config, site: e.target.value })} placeholder="www.suaempresa.com.br" style={inputStyle} />
        </div>
      </div>

      {/* Endereço */}
      <div style={cardStyle}>
        <p style={{ fontSize: 11, fontWeight: '600', color: t.textoFraco, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' }}>Endereço</p>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Endereço (rua e número)</label>
          <input value={config.endereco} onChange={e => setConfig({ ...config, endereco: e.target.value })} placeholder="Rua das Flores, 123" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Bairro</label>
          <input value={config.bairro} onChange={e => setConfig({ ...config, bairro: e.target.value })} placeholder="Centro" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Cidade</label>
          <input value={config.cidade} onChange={e => setConfig({ ...config, cidade: e.target.value })} placeholder="Chapecó" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>CEP</label>
          <input value={config.cep} onChange={e => setConfig({ ...config, cep: e.target.value })} placeholder="89800-000" style={inputStyle} />
        </div>
      </div>

      {mensagem && (
        <div style={{ background: mensagem.tipo === 'ok' ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)', border: `1px solid ${mensagem.tipo === 'ok' ? cores.pronto : cores.perigo}`, color: mensagem.tipo === 'ok' ? cores.pronto : cores.perigo, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
          {mensagem.texto}
        </div>
      )}

      <button onClick={salvarConfig} disabled={salvando} style={{ background: salvando ? t.textoFraco : t.azul, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 15, cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: '500', boxShadow: `0 4px 14px ${modo === 'dark' ? 'rgba(55,138,221,0.35)' : 'rgba(24,95,165,0.25)'}` }}>
        {salvando ? 'Salvando...' : '💾 Salvar configurações'}
      </button>
    </div>
  )
}

export default Configuracoes
