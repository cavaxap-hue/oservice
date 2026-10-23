import { createClient } from '@supabase/supabase-js'

// Arquivo com "_" na frente: a Vercel nao publica como rota, so serve de modulo compartilhado
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Valida o access_token do Supabase (header Authorization: Bearer) e devolve a empresa do usuario.
// Retorna { usuario, empresa } ou { status, error } para responder direto.
export async function empresaDoUsuario(req) {
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')?.[1]
  if (!token) return { status: 401, error: 'Sessão expirada. Entre novamente.' }

  const { data: auth, error: errAuth } = await supabaseAdmin.auth.getUser(token)
  if (errAuth || !auth?.user) return { status: 401, error: 'Sessão expirada. Entre novamente.' }

  const { data: vinculo, error: errVinculo } = await supabaseAdmin
    .from('usuario_empresa')
    .select('empresa_id')
    .eq('user_id', auth.user.id)
    .limit(1)
    .maybeSingle()
  if (errVinculo) {
    console.error('Erro ao buscar vinculo do usuario', auth.user.id, errVinculo)
    return { status: 500, error: 'Não foi possível carregar sua empresa.' }
  }
  if (!vinculo) return { status: 404, error: 'Sua conta não está vinculada a nenhuma empresa.' }

  const { data: empresa, error: errEmpresa } = await supabaseAdmin
    .from('empresas')
    .select('id, status_assinatura, stripe_customer_id, stripe_subscription_id')
    .eq('id', vinculo.empresa_id)
    .maybeSingle()
  if (errEmpresa) {
    console.error('Erro ao buscar empresa', vinculo.empresa_id, errEmpresa)
    return { status: 500, error: 'Não foi possível carregar sua empresa.' }
  }
  if (!empresa) return { status: 404, error: 'Empresa não encontrada.' }

  return { usuario: auth.user, empresa }
}
