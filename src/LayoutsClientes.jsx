import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { cores } from './theme'

function LayoutsClientes({ t, modo, empresaId }) {
  const [clientes, setClientes] = useState([])
  const [pastasLivres, setPastasLivres] = useState([])
  const [pastaAberta, setPastaAberta] = useState(null) // { tipo: 'cliente'|'pasta', id, nome }
  const [anotacoes, setAnotacoes] = useState([])
  const [busca, setBusca] = useState('')
  const [novaPasta, setNovaPasta] = useState('')
  const [criandoPasta, setCriandoPasta] = useState(false)
  const [anotacaoSel, setAnotacaoSel] = useState(null) // anotação aberta no editor
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    const { data: cli } = await supabase.from('clientes').select('id, nome, telefone').eq('empresa_id', empresaId).order('nome', { ascending: true })
    const { data: pas } = await supabase.from('pastas').select('*').eq('empresa_id', empresaId).order('nome', { ascending: true })
    if (cli) setClientes(cli)
    if (pas) setPastasLivres(pas)
  }

  async function abrirPasta(tipo, id, nome) {
    setPastaAberta({ tipo, id, nome })
    setAnotacaoSel(null)
    setTitulo('')
    setConteudo('')
    const coluna = tipo === 'cliente' ? 'cliente_id' : 'pasta_id'
    const { data } = await supabase.from('anotacoes').select('*').eq(coluna, id).order('created_at', { ascending: false })
    if (data) setAnotacoes(data)
    else setAnotacoes([])
  }

  async function criarPastaLivre() {
    if (!novaPasta.trim()) return
    await supabase.from('pastas').insert([{ nome: novaPasta.trim(), empresa_id: empresaId }])
    setNovaPasta('')
    setCriandoPasta(false)
    carregarTudo()
  }

  async function excluirPastaLivre(id, e) {
    e.stopPropagation()
    if (window.confirm('Excluir esta pasta e todas as anotações dela?')) {
      await supabase.from('anotacoes').delete().eq('pasta_id', id)
      await supabase.from('pastas').delete().eq('id', id)
      if (pastaAberta?.id === id) setPastaAberta(null)
      carregarTudo()
    }
  }

  function novaAnotacao() {
    setAnotacaoSel('nova')
    setTitulo('')
    setConteudo('')
  }

  function abrirAnotacao(a) {
    setAnotacaoSel(a.id)
    setTitulo(a.titulo)
    setConteudo(a.conteudo || '')
  }

  async function salvarAnotacao() {
    if (!titulo.trim()) { window.alert('Dê um título para a anotação.'); return }
    setSalvando(true)
    const campo = pastaAberta.tipo === 'cliente' ? { cliente_id: pastaAberta.id } : { pasta_id: pastaAberta.id }
    if (anotacaoSel === 'nova') {
      await supabase.from('anotacoes').insert([{ ...campo, titulo: titulo.trim(), conteudo }])
    } else {
      await supabase.from('anotacoes').update({ titulo: titulo.trim(), conteudo }).eq('id', anotacaoSel)
    }
    setSalvando(false)
    abrirPasta(pastaAberta.tipo, pastaAberta.id, pastaAberta.nome)
  }

  async function excluirAnotacao(id) {
    if (window.confirm('Excluir esta anotação?')) {
      await supabase.from('anotacoes').delete().eq('id', id)
      setAnotacaoSel(null)
      abrirPasta(pastaAberta.tipo, pastaAberta.id, pastaAberta.nome)
    }
  }

  // Monta lista de pastas (clientes + livres) filtrada pela busca
  const pastas = [
    ...pastasLivres.map(p => ({ tipo: 'pasta', id: p.id, nome: p.nome, livre: true })),
    ...clientes.map(c => ({ tipo: 'cliente', id: c.id, nome: c.nome, telefone: c.telefone, livre: false })),
  ].filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${t.inputBorda}`, fontSize: 14, outline: 'none',
    boxSizing: 'border-box', background: t.inputBg, color: t.texto,
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ color: t.texto, fontSize: 22, fontWeight: '500', margin: 0 }}>📁 Layouts Clientes</h1>
        <p style={{ color: t.textoFraco, fontSize: 13, margin: '4px 0 0' }}>Anotações, senhas e configurações organizadas por cliente</p>
      </div>

      {!pastaAberta ? (
        // ===== VISÃO DE PASTAS =====
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar pasta..." style={{ ...inputStyle, maxWidth: 280 }} />
            {!criandoPasta ? (
              <button onClick={() => setCriandoPasta(true)} style={{ background: t.azul, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap' }}>+ Nova pasta</button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={novaPasta} onChange={e => setNovaPasta(e.target.value)} placeholder="Nome da pasta" autoFocus onKeyDown={e => e.key === 'Enter' && criarPastaLivre()} style={{ ...inputStyle, maxWidth: 200 }} />
                <button onClick={criarPastaLivre} style={{ background: cores.pronto, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Criar</button>
                <button onClick={() => { setCriandoPasta(false); setNovaPasta('') }} style={{ background: 'transparent', color: t.textoFraco, border: `1px solid ${t.borda}`, padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {pastas.length === 0 ? (
              <p style={{ color: t.textoFraco, fontSize: 14 }}>Nenhuma pasta encontrada.</p>
            ) : pastas.map(p => (
              <div key={p.tipo + p.id} onClick={() => abrirPasta(p.tipo, p.id, p.nome)} style={{ background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18, cursor: 'pointer', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: modo === 'dark' ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{p.livre ? '📁' : '👤'}</div>
                <div style={{ color: t.texto, fontWeight: '500', fontSize: 14, wordBreak: 'break-word' }}>{p.nome}</div>
                {p.telefone && <div style={{ color: t.textoFraco, fontSize: 12, marginTop: 2 }}>{p.telefone}</div>}
                {p.livre && (
                  <button onClick={(e) => excluirPastaLivre(p.id, e)} style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: t.textoFraco, cursor: 'pointer', fontSize: 14, opacity: 0.6 }} title="Excluir pasta">✕</button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        // ===== DENTRO DE UMA PASTA =====
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <button onClick={() => { setPastaAberta(null); setAnotacaoSel(null) }} style={{ background: 'transparent', color: t.textoSuave, border: `1px solid ${t.borda}`, padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>← Voltar</button>
            <span style={{ color: t.texto, fontSize: 16, fontWeight: '500' }}>{pastaAberta.tipo === 'cliente' ? '👤' : '📁'} {pastaAberta.nome}</span>
            <button onClick={novaAnotacao} style={{ background: t.azul, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: '500', marginLeft: 'auto' }}>+ Nova anotação</button>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Lista de anotações */}
            <div style={{ flex: '0 0 240px', minWidth: 220 }}>
              {anotacoes.length === 0 && anotacaoSel !== 'nova' ? (
                <p style={{ color: t.textoFraco, fontSize: 13 }}>Nenhuma anotação. Crie a primeira!</p>
              ) : anotacoes.map(a => (
                <div key={a.id} onClick={() => abrirAnotacao(a)} style={{ background: anotacaoSel === a.id ? t.azul : t.card, border: `1px solid ${anotacaoSel === a.id ? t.azul : t.cardBorda}`, borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ color: anotacaoSel === a.id ? '#fff' : t.texto, fontWeight: '500', fontSize: 13 }}>🔑 {a.titulo}</div>
                  <div style={{ color: anotacaoSel === a.id ? 'rgba(255,255,255,0.7)' : t.textoFraco, fontSize: 11, marginTop: 2 }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
              ))}
            </div>

            {/* Editor estilo notepad */}
            {anotacaoSel !== null && (
              <div style={{ flex: 1, minWidth: 280, background: t.card, border: `1px solid ${t.cardBorda}`, borderRadius: 12, padding: 18 }}>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título (ex: Senha WiFi, Acesso NVR...)" style={{ ...inputStyle, fontWeight: '500', marginBottom: 12 }} />
                <textarea value={conteudo} onChange={e => setConteudo(e.target.value)} placeholder="Escreva aqui as senhas, configurações, IPs, observações..." rows={12} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={salvarAnotacao} disabled={salvando} style={{ background: salvando ? t.textoFraco : cores.pronto, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: '500' }}>{salvando ? 'Salvando...' : '💾 Salvar'}</button>
                  {anotacaoSel !== 'nova' && (
                    <button onClick={() => excluirAnotacao(anotacaoSel)} style={{ background: 'transparent', color: cores.perigo, border: `1px solid ${cores.perigo}`, padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>🗑 Excluir</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default LayoutsClientes
