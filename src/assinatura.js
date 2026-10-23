import { supabase } from './supabase'

// Chama /api/create-checkout-session ou /api/portal com o token da sessão e redireciona para o Stripe
export async function abrirStripe(rota, erroPadrao) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão expirada. Entre novamente.')
  const resp = await fetch(rota, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok || !data.url) throw new Error(data.error || erroPadrao)
  window.location.href = data.url
}

export const iniciarCheckout = () => abrirStripe('/api/create-checkout-session', 'Não foi possível abrir o pagamento.')
export const abrirPortal = () => abrirStripe('/api/portal', 'Não foi possível abrir o portal de assinatura.')
