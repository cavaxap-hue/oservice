import Stripe from 'stripe'
import { empresaDoUsuario } from './_empresa-do-usuario.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const STATUS_LIBERADOS = ['trial', 'ativa']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // A empresa vem do usuario autenticado, nunca do body
    const { usuario, empresa, status, error } = await empresaDoUsuario(req)
    if (error) return res.status(status).json({ error })

    if (STATUS_LIBERADOS.includes(empresa.status_assinatura)) {
      return res.status(400).json({ error: 'Sua assinatura já está ativa' })
    }

    const empresaId = String(empresa.id)
    // Teste gratis so para quem nunca teve assinatura; quem cancelou e volta assina direto
    const nuncaAssinou = !empresa.stripe_subscription_id

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      ...(empresa.stripe_customer_id
        ? { customer: empresa.stripe_customer_id }
        : { customer_email: usuario.email }),
      client_reference_id: empresaId,
      metadata: { empresa_id: empresaId },
      subscription_data: {
        ...(nuncaAssinou ? { trial_period_days: 7 } : {}),
        metadata: { empresa_id: empresaId },
      },
      success_url: `${req.headers.origin}/?assinatura=sucesso&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?assinatura=cancelado`,
    })

    res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Erro ao criar sessao de checkout:', error)
    res.status(500).json({ error: error.message })
  }
}
