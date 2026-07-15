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
    const email = session.customer_email || session.customer_details?.email

    if (!email) {
      console.error('Sessao sem email:', session.id)
      return res.status(400).json({ error: 'Email nao encontrado na sessao' })
    }

    try {
      // 1. Verifica se ja existe usuario com esse email
      const { data: existentes } = await supabaseAdmin.auth.admin.listUsers()
      const jaExiste = existentes.users.find(u => u.email === email)

      let userId
      let senhaGerada = null

      if (jaExiste) {
        userId = jaExiste.id
      } else {
        // 2. Cria o usuario no Supabase Auth
        senhaGerada = gerarSenhaAleatoria()
        const { data: novoUsuario, error: errUser } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: senhaGerada,
          email_confirm: true,
        })
        if (errUser) throw errUser
        userId = novoUsuario.user.id
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
          .insert([{ nome: nomeEmpresa }])
          .select()
          .single()
        if (errEmpresa) throw errEmpresa

        // 5. Vincula usuario a empresa
        const { error: errVinculo } = await supabaseAdmin
          .from('usuario_empresa')
          .insert([{ user_id: userId, empresa_id: novaEmpresa.id }])
        if (errVinculo) throw errVinculo
      }

      console.log('Conta provisionada com sucesso para:', email, senhaGerada ? '(nova conta)' : '(conta existente)')

      // TODO: enviar email de boas-vindas com a senha gerada (senhaGerada)
      // Por enquanto o cliente usa "Esqueci minha senha" para definir a propria senha

      return res.status(200).json({ received: true })
    } catch (err) {
      console.error('Erro ao provisionar conta:', err)
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(200).json({ received: true })
}
