import { supabase } from './supabase'
import { carregarItensOS, somaItens, escaparHtml as h } from './estoqueUtil'

// Comprovante de entrada para impressora térmica (80 mm ou 58 mm).
// A janela é aberta antes de qualquer await para o navegador não bloquear o pop-up.
export async function imprimirComprovante(os, empresaId) {
  const janela = window.open('', '_blank', 'width=420,height=640')
  if (!janela) { window.alert('Permita pop-ups deste site para imprimir o comprovante.'); return }
  janela.document.write('<p style="font-family:monospace">Preparando comprovante...</p>')

  const [{ data: cfg }, itens] = await Promise.all([
    supabase.from('configuracoes').select('*').eq('empresa_id', empresaId).limit(1).maybeSingle(),
    carregarItensOS(os.id, empresaId),
  ])
  const empresa = cfg || {}
  const largura = empresa.largura_impressora === '58' ? 58 : 80
  const areaUtil = largura === 58 ? 48 : 72
  const fonte = largura === 58 ? 10 : 12

  const numeroOS = String(os.numero || 0).padStart(4, '0')
  const entrada = new Date(os.created_at)
  const equipamento = [os.tipo, os.modelo].filter(Boolean).join(' — ')
  const totalPecas = somaItens(itens)
  const linha = (rotulo, valor) => valor ? `<div class="campo"><b>${rotulo}:</b> ${h(valor)}</div>` : ''

  janela.document.open()
  janela.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Comprovante OS ${numeroOS}</title>
<style>
  @page { size: ${largura}mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: ${largura}mm; padding: 3mm ${(largura - areaUtil) / 2}mm 6mm; font-family: 'Courier New', Courier, monospace; font-size: ${fonte}px; line-height: 1.35; }
  .centro { text-align: center; }
  .logo { display: block; max-width: 100%; max-height: 22mm; margin: 0 auto 2mm; filter: grayscale(1); }
  .empresa { font-weight: bold; font-size: ${fonte + 2}px; }
  .tracejado { border: 0; border-top: 1px dashed #000; margin: 2.5mm 0; }
  .numero { font-size: ${fonte * 2}px; font-weight: bold; text-align: center; margin: 1mm 0 2mm; letter-spacing: 0.5px; }
  .campo { margin-bottom: 1.2mm; word-wrap: break-word; overflow-wrap: anywhere; }
  table { width: 100%; border-collapse: collapse; font-size: ${fonte - 1}px; }
  td { padding: 0.6mm 0; vertical-align: top; }
  td.valor { text-align: right; white-space: nowrap; padding-left: 2mm; }
  .total { font-weight: bold; font-size: ${fonte + 1}px; }
  .rodape { white-space: pre-wrap; text-align: center; overflow-wrap: anywhere; }
  .assinatura { margin-top: 14mm; border-top: 1px solid #000; padding-top: 1mm; text-align: center; }
</style>
</head>
<body>
  <div class="centro">
    ${empresa.logo_url ? `<img class="logo" src="${h(empresa.logo_url)}" alt="">` : ''}
    <div class="empresa">${h(empresa.nome_empresa || 'Supradesk')}</div>
    ${empresa.telefone ? `<div>${h(empresa.telefone)}</div>` : ''}
  </div>
  <hr class="tracejado">
  <div class="numero">OS Nº ${numeroOS}</div>
  ${linha('Entrada', `${entrada.toLocaleDateString('pt-BR')} ${entrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)}
  ${linha('Cliente', os.cliente)}
  ${linha('Telefone', os.telefone)}
  ${linha('Equipamento', equipamento)}
  ${linha('Nº de série', os.numero_serie)}
  ${linha('Acessórios', os.acessorios)}
  ${linha('Defeito relatado', os.problema)}
  ${linha('Status', os.status)}
  ${itens.length ? `
  <hr class="tracejado">
  <table>
    ${itens.map(i => `<tr><td>${h(Number(i.quantidade))}x ${h(i.descricao)}</td><td class="valor">${(Number(i.quantidade) * Number(i.preco_unitario)).toFixed(2)}</td></tr>`).join('')}
    <tr><td class="total">Total peças</td><td class="valor total">R$ ${totalPecas.toFixed(2)}</td></tr>
  </table>` : ''}
  <hr class="tracejado">
  ${empresa.texto_comprovante ? `<div class="rodape">${h(empresa.texto_comprovante)}</div>` : ''}
  <div class="assinatura">Assinatura do cliente</div>
</body>
</html>`)
  janela.document.close()

  // Só imprime depois que a logo carregar (ou falhar), com limite de 3 s
  let impresso = false
  function imprimir() {
    if (impresso) return
    impresso = true
    janela.focus()
    janela.print()
  }
  const logo = janela.document.querySelector('img.logo')
  if (!logo || logo.complete) { imprimir(); return }
  logo.onload = imprimir
  logo.onerror = () => { logo.remove(); imprimir() }
  setTimeout(imprimir, 3000)
}
