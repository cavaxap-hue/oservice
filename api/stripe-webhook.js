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

const EVENTOS_ASSINATURA = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

const STATUS_POR_STRIPE = {
  trialing: 'trial',
  active: 'ativa',
  past_due: 'inadimplente',
  unpaid: 'inadimplente',
  paused: 'inadimplente',
  canceled: 'cancelada',
  incomplete: 'pendente',
  incomplete_expired: 'pendente',
}

// Assinaturas que nao voltam mais: nunca substituem outra assinatura ja vinculada a empresa
const STATUS_STRIPE_FINAIS = ['canceled', 'incomplete_expired']

// Campos expansiveis chegam como id (string) ou como objeto
function idDe(valor) {
  return typeof valor === 'string' ? valor : valor?.id || null
}

function extrairSubscriptionId(objeto) {
  if (objeto.object === 'subscription') return objeto.id
  if (objeto.object === 'checkout.session') return idDe(objeto.subscription)
  if (objeto.object === 'invoice') {
    // API nova (basil+): invoice.parent.subscription_details.subscription; antiga: invoice.subscription
    return idDe(objeto.parent?.subscription_details?.subscription) || idDe(objeto.subscription)
  }
  return null
}

// trial_end durante o teste; senao o fim do periodo (API nova: no item; antiga: na subscription)
function calcularValidaAte(subscription) {
  const fim = subscription.status === 'trialing' && subscription.trial_end
    ? subscription.trial_end
    : subscription.items?.data?.[0]?.current_period_end ?? subscription.current_period_end
  return fim ? new Date(fim * 1000).toISOString() : null
}

const CAMPOS_EMPRESA = 'id, status_assinatura, stripe_subscription_id'

async function buscarEmpresaPor(coluna, valor) {
  if (!valor) return null
  const { data, error } = await supabaseAdmin
    .from('empresas')
    .select(CAMPOS_EMPRESA)
    .eq(coluna, valor)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

async function encontrarEmpresa(subscription, empresaIdSessao) {
  return (
    (await buscarEmpresaPor('stripe_subscription_id', subscription.id)) ||
    (await buscarEmpresaPor('id', subscription.metadata?.empresa_id)) ||
    (await buscarEmpresaPor('id', empresaIdSessao)) ||
    (await buscarEmpresaPor('stripe_customer_id', idDe(subscription.customer)))
  )
}

// Sempre le o estado atual da subscription no Stripe: eventos podem chegar fora de ordem ou repetidos
async function sincronizarAssinatura(subscriptionId, empresaIdSessao, tipoEvento) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const empresa = await encontrarEmpresa(subscription, empresaIdSessao)
  if (!empresa) {
    console.error('Empresa nao encontrada para a subscription', subscription.id, `(${tipoEvento})`)
    return
  }

  if (
    empresa.stripe_subscription_id &&
    empresa.stripe_subscription_id !== subscription.id &&
    STATUS_STRIPE_FINAIS.includes(subscription.status)
  ) {
    console.log('Ignorando subscription encerrada', subscription.id, 'da empresa', empresa.id, '- vinculada a', empresa.stripe_subscription_id)
    return
  }

  const novoStatus = STATUS_POR_STRIPE[subscription.status]
  if (!novoStatus) {
    console.error('Status de subscription desconhecido:', subscription.status, subscription.id)
    return
  }

  const { error } = await supabaseAdmin
    .from('empresas')
    .update({
      status_assinatura: novoStatus,
      assinatura_valida_ate: calcularValidaAte(subscription),
      stripe_subscription_id: subscription.id,
      stripe_customer_id: idDe(subscription.customer),
    })
    .eq('id', empresa.id)
  if (error) throw error

  console.log(`Assinatura empresa ${empresa.id}: ${empresa.status_assinatura} → ${novoStatus} (${tipoEvento}, ${subscription.id})`)
}

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

  if (!EVENTOS_ASSINATURA.has(event.type)) {
    return res.status(200).json({ received: true })
  }

  const objeto = event.data.object
  const empresaIdSessao = event.type === 'checkout.session.completed'
    ? objeto.client_reference_id || objeto.metadata?.empresa_id || null
    : null

  // Fluxo novo (e todos os eventos de subscription/invoice): sincroniza com o estado atual no Stripe
  if (event.type !== 'checkout.session.completed' || empresaIdSessao) {
    const subscriptionId = extrairSubscriptionId(objeto)
    if (!subscriptionId) return res.status(200).json({ received: true })
    try {
      await sincronizarAssinatura(subscriptionId, empresaIdSessao, event.type)
      return res.status(200).json({ received: true })
    } catch (err) {
      console.error('Erro ao sincronizar assinatura', subscriptionId, `(${event.type}):`, err)
      return res.status(500).json({ error: err.message })
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = objeto

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
