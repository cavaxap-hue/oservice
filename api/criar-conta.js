import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailJaExiste(err) {
  return err?.code === 'email_exists' || /already (been )?registered|already exists/i.test(err?.message || '')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const empresa = String(req.body?.empresa || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const senha = String(req.body?.senha || '')

  if (!empresa) return res.status(400).json({ error: 'Informe o nome da empresa.' })
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' })
  if (senha.length < 6) return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' })

  // 1. Cria o usuario ja confirmado (o pagamento no Stripe e a validacao real)
  const { data: novoUsuario, error: errUser } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (errUser) {
    if (emailJaExiste(errUser)) {
      return res.status(409).json({ error: "Este e-mail já tem conta. Use 'Já sou cliente' para entrar." })
    }
    console.error('Erro ao criar usuario:', errUser)
    return res.status(500).json({ error: 'Não foi possível criar a conta. Tente novamente.' })
  }

  const userId = novoUsuario.user.id
  let empresaId = null

  try {
    // 2. Cria a empresa aguardando pagamento
    const { data: novaEmpresa, error: errEmpresa } = await supabaseAdmin
      .from('empresas')
      .insert([{ nome: empresa, status_assinatura: 'pendente' }])
      .select()
      .single()
    if (errEmpresa) throw errEmpresa
    empresaId = novaEmpresa.id

    // 3. Vincula usuario a empresa
    const { error: errVinculo } = await supabaseAdmin
      .from('usuario_empresa')
      .insert([{ user_id: userId, empresa_id: empresaId }])
    if (errVinculo) throw errVinculo

    return res.status(200).json({ empresa_id: empresaId })
  } catch (err) {
    console.error('Erro ao criar empresa, desfazendo cadastro:', err)
    // Rollback: nao deixa empresa nem usuario orfaos
    if (empresaId) {
      const { error: errDelEmpresa } = await supabaseAdmin.from('empresas').delete().eq('id', empresaId)
      if (errDelEmpresa) console.error('Erro no rollback da empresa:', errDelEmpresa)
    }
    const { error: errDelUser } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (errDelUser) console.error('Erro no rollback do usuario:', errDelUser)
    return res.status(500).json({ error: 'Não foi possível criar a conta. Tente novamente.' })
  }
}
