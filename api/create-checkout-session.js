import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${req.headers.origin}/?assinatura=sucesso&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?assinatura=cancelado`,
    })

    res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Erro ao criar sessao de checkout:', error)
    res.status(500).json({ error: error.message })
  }
}
