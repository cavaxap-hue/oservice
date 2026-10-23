import Stripe from 'stripe'
import { empresaDoUsuario } from './_empresa-do-usuario.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { empresa, status, error } = await empresaDoUsuario(req)
    if (error) return res.status(status).json({ error })

    if (!empresa.stripe_customer_id) {
      return res.status(400).json({ error: 'Sua empresa ainda não tem assinatura no Stripe.' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: empresa.stripe_customer_id,
      return_url: req.headers.origin,
    })

    res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Erro ao criar sessao do portal:', error)
    res.status(500).json({ error: error.message })
  }
}
