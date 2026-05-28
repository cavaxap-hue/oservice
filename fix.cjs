const fs = require('fs')
let c = fs.readFileSync('src/LayoutsClientes.jsx', 'utf8')

c = c.replace(
  'function LayoutsClientes({ t, modo })',
  'function LayoutsClientes({ t, modo, empresaId })'
)

c = c.replace(
  "supabase.from('clientes').select('id, nome, telefone').order('nome'",
  "supabase.from('clientes').select('id, nome, telefone').eq('empresa_id', empresaId).order('nome'"
)

c = c.replace(
  "supabase.from('pastas').select('*').order('nome'",
  "supabase.from('pastas').select('*').eq('empresa_id', empresaId).order('nome'"
)

c = c.replace(
  "supabase.from('pastas').insert([{ nome: novaPasta.trim() }])",
  "supabase.from('pastas').insert([{ nome: novaPasta.trim(), empresa_id: empresaId }])"
)

fs.writeFileSync('src/LayoutsClientes.jsx', c, 'utf8')
console.log('assinatura:', c.includes('empresaId })'))
console.log('insert empresa:', c.includes('empresa_id: empresaId'))