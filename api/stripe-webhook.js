import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

function gerarSenhaAleatoria() {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase()
}

// Percorre todas as paginas do Auth (listUsers sem paginacao so traz os primeiros 50)
async function buscarUsuarioPorEmail(email) {
  const perPage = 1000
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const encontrado = data.users.find(u => u.email?.toLowerCase() === email)
    if (encontrado) return encontrado
    if (data.users.length < perPage) return null
  }
}

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Erro na assinatura do webhook:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const empresaId = session.client_reference_id || session.metadata?.empresa_id

    // Fluxo novo: usuario e empresa ja foram criados em /api/criar-conta
    if (empresaId) {
      const { data: atualizadas, error: errUpdate } = await supabaseAdmin
        .from('empresas')
        .update({
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status_assinatura: 'trial',
          assinatura_valida_ate: new Date(Date.now() + SETE_DIAS_MS).toISOString(),
        })
        .eq('id', empresaId)
        .eq('status_assinatura', 'pendente') // nunca rebaixa empresa 'ativa'/'trial'
        .select('id')
      if (errUpdate) {
        console.error('Erro ao ativar trial da empresa', empresaId, errUpdate)
        return res.status(500).json({ error: errUpdate.message })
      }
      if (!atualizadas?.length) console.error('Empresa da sessao nao encontrada ou nao esta pendente:', empresaId, session.id)
      else console.log('Trial ativado para empresa:', empresaId)
      return res.status(200).json({ received: true })
    }

    // Fallback (fluxo antigo): sessao sem empresa_id, cria usuario/empresa a partir do email
    const email = (session.customer_email || session.customer_details?.email || '').trim().toLowerCase()

    if (!email) {
      console.error('Sessao sem email:', session.id)
      return res.status(400).json({ error: 'Email nao encontrado na sessao' })
    }

    try {
      // 1. Verifica se ja existe usuario com esse email
      const jaExiste = await buscarUsuarioPorEmail(email)

      let userId
      let contaNova = false

      if (jaExiste) {
        userId = jaExiste.id
      } else {
        // 2. Cria o usuario no Supabase Auth com senha temporaria aleatoria
        const senhaTemporaria = gerarSenhaAleatoria()
        const { data: novoUsuario, error: errUser } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: senhaTemporaria,
          email_confirm: true,
        })
        if (errUser) throw errUser
        userId = novoUsuario.user.id
        contaNova = true
      }

      // 3. Verifica se ja tem empresa vinculada
      const { data: vinculoExistente } = await supabaseAdmin
        .from('usuario_empresa')
        .select('empresa_id')
        .eq('user_id', userId)
        .single()

      if (!vinculoExistente) {
        // 4. Cria a empresa
        const nomeEmpresa = session.customer_details?.name || email.split('@')[0]
        const { data: novaEmpresa, error: errEmpresa } = await supabaseAdmin
          .from('empresas')
          .insert([{
            nome: nomeEmpresa,
            status_assinatura: 'ativa',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          }])
          .select()
          .single()
        if (errEmpresa) throw errEmpresa

        // 5. Vincula usuario a empresa
        const { error: errVinculo } = await supabaseAdmin
          .from('usuario_empresa')
          .insert([{ user_id: userId, empresa_id: novaEmpresa.id }])
        if (errVinculo) throw errVinculo
      }

      console.log('Conta provisionada com sucesso para:', email, contaNova ? '(nova conta)' : '(conta existente)')

      // Envia email para definir senha (apenas para contas novas)
      if (contaNova) {
        const { error: errReset } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.SITE_URL || 'https://supradeskos.vercel.app'}`,
        })
        if (errReset) console.error('Erro ao enviar email de boas-vindas:', errReset)
      }

      return res.status(200).json({ received: true })
    } catch (err) {
      console.error('Erro ao provisionar conta:', err)
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(200).json({ received: true })
}
