// ============================================================
// SUPRADESK — Textos legais (Termos de Uso e Política de Privacidade)
// Fonte única: as páginas /termos e /privacidade e o rodapé leem daqui.
// Ao abrir CNPJ, troque os dados em FORNECEDOR e a data de atualização.
// ============================================================

export const FORNECEDOR = {
  marca: "Supradesk",
  produto: "Supradesk OS",
  responsavel: "Claudio Rafael Cavalli",
  documento: "CPF 826.111.730-87",
  tipo: "pessoa física",
  endereco: "Tv. Ana de Lima Gonzaga, s/n",
  bairro: "Qd Palmital",
  cidade: "Chapecó/SC",
  cep: "89815-300",
  email: "ultratechcco@gmail.com",
  whatsapp: "(49) 98886-9648",
  site: "supradeskos.vercel.app",
}

export const ATUALIZADO_EM = "23 de outubro de 2026"

export function enderecoCompleto() {
  const f = FORNECEDOR
  return [f.endereco, f.bairro, f.cidade, f.cep ? "CEP " + f.cep : ""].filter(Boolean).join(" — ")
}

function identificacao() {
  const f = FORNECEDOR
  return "O " + f.produto + " é um produto da marca " + f.marca + ", operada por " + f.responsavel + ", " + f.tipo + ", inscrito no " + f.documento + ", com endereço em " + enderecoCompleto() + " (“Supradesk”, “nós”). Contato: " + f.email + " e WhatsApp " + f.whatsapp + "."
}

// ============================================================
// TERMOS DE USO
// ============================================================
export const TERMOS = {
  titulo: "Termos de Uso",
  intro: [
    "Estes Termos regulam o uso do Supradesk OS, sistema online de gestão para assistências técnicas. Ao criar uma conta ou usar o sistema, você declara que leu e concorda com estes Termos e com a nossa Política de Privacidade.",
  ],
  secoes: [
    {
      titulo: "1. Quem fornece o serviço",
      paragrafos: [identificacao()],
    },
    {
      titulo: "2. O que é o serviço",
      paragrafos: [
        "O Supradesk OS é um software acessado pela internet (modelo SaaS) que permite registrar ordens de serviço, clientes, equipamentos, manutenções preventivas, anotações e relatórios, além de gerar documentos em PDF com os dados da sua empresa.",
        "O sistema não emite nota fiscal. A emissão de documentos fiscais continua sendo responsabilidade do assinante, pelos meios oficiais.",
        "O que você contrata é uma licença de uso pessoal, não exclusiva e intransferível, válida enquanto a assinatura estiver ativa.",
      ],
    },
    {
      titulo: "3. Conta e acesso",
      paragrafos: [
        "Para usar o sistema é preciso ser maior de 18 anos e informar dados verdadeiros no cadastro. Cada conta corresponde a uma empresa ou profissional.",
        "Você é responsável por manter sua senha em sigilo e por todas as ações feitas com o seu login. Se suspeitar de acesso indevido, troque a senha e nos avise.",
        "Os dados de cada empresa ficam isolados: uma conta não tem acesso aos dados de outra.",
      ],
    },
    {
      titulo: "4. Teste grátis de 7 dias",
      paragrafos: [
        "Novas empresas têm 7 dias grátis para testar todas as funções. Para iniciar o teste é necessário cadastrar um cartão de crédito, mas nenhuma cobrança é feita durante esse período.",
        "Se você cancelar antes do fim dos 7 dias, não será cobrado. Se não cancelar, a assinatura mensal começa automaticamente ao fim do teste.",
        "O teste grátis é concedido uma única vez por empresa. Quem cancela e volta a assinar não tem direito a um novo período de teste.",
      ],
    },
    {
      titulo: "5. Preço e pagamento",
      paragrafos: [
        "A assinatura custa R$ 39,00 por mês, cobrados automaticamente no cartão cadastrado, a cada mês, a partir do fim do teste grátis.",
        "Os pagamentos são processados pela Stripe, empresa especializada em pagamentos online. O Supradesk não tem acesso ao número completo do seu cartão nem o armazena.",
        "Se uma cobrança não for aprovada, a Stripe faz novas tentativas nos dias seguintes. Enquanto o pagamento estiver pendente, o acesso ao sistema fica suspenso, e é liberado automaticamente quando o pagamento for regularizado. Você pode atualizar o cartão pelo próprio sistema.",
        "Eventuais reajustes de preço serão comunicados com pelo menos 30 dias de antecedência, por e-mail ou no próprio sistema. Se não concordar, você pode cancelar antes de o novo valor entrar em vigor.",
      ],
    },
    {
      titulo: "6. Cancelamento e reembolso",
      paragrafos: [
        "Você pode cancelar quando quiser, sem multa, pelo botão “Gerenciar assinatura” em Configurações ou pelo nosso e-mail de contato.",
        "O cancelamento vale ao fim do período já pago: até lá, o acesso continua normal e não há novas cobranças.",
        "Direito de arrependimento: se você pedir o cancelamento em até 7 dias após a primeira cobrança, devolvemos o valor integral dessa cobrança. Fora desse prazo, não há reembolso proporcional do mês em andamento.",
      ],
    },
    {
      titulo: "7. Seus dados depois do cancelamento",
      paragrafos: [
        "Os dados que você cadastrou pertencem a você. Depois do cancelamento, eles ficam guardados por 90 dias, para o caso de você voltar a assinar ou pedir uma cópia. Passado esse prazo, são excluídos definitivamente, salvo o que a lei obrigar a manter.",
        "Você pode pedir a exclusão antecipada a qualquer momento pelo nosso e-mail de contato.",
      ],
    },
    {
      titulo: "8. Uso permitido",
      paragrafos: [
        "Não é permitido: usar o sistema para atividades ilegais; tentar acessar dados de outras empresas ou partes restritas do sistema; copiar, revender ou sublicenciar o software; fazer engenharia reversa; ou sobrecarregar o serviço de forma intencional.",
        "Você é responsável pelas informações que registra no sistema, inclusive dados pessoais dos seus próprios clientes, e deve ter base legal para tratá-los (veja a Política de Privacidade).",
        "Em caso de violação destes Termos, a conta poderá ser suspensa ou encerrada, com aviso prévio sempre que possível.",
      ],
    },
    {
      titulo: "9. Disponibilidade do serviço",
      paragrafos: [
        "Trabalhamos para manter o sistema disponível e seguro, mas não podemos garantir funcionamento ininterrupto. Pode haver pausas para manutenção ou falhas de provedores de internet e hospedagem.",
        "Recomendamos guardar cópia dos documentos importantes, como os PDFs das ordens de serviço.",
      ],
    },
    {
      titulo: "10. Responsabilidade",
      paragrafos: [
        "Na extensão permitida pela lei, o Supradesk não responde por lucros cessantes, perda de negócios ou decisões tomadas com base nas informações do sistema, nem por falhas causadas por terceiros, como provedores de internet.",
        "Nada nestes Termos afasta direitos garantidos pelo Código de Defesa do Consumidor, quando ele for aplicável.",
      ],
    },
    {
      titulo: "11. Propriedade intelectual",
      paragrafos: [
        "O software, a marca Supradesk e o visual do sistema pertencem ao fornecedor. Os dados que você insere continuam sendo seus.",
      ],
    },
    {
      titulo: "12. Alterações destes Termos",
      paragrafos: [
        "Podemos atualizar estes Termos. Mudanças relevantes serão avisadas por e-mail ou no sistema com pelo menos 15 dias de antecedência. Continuar usando o sistema depois disso significa concordar com a nova versão.",
      ],
    },
    {
      titulo: "13. Foro",
      paragrafos: [
        "Estes Termos seguem as leis brasileiras. Fica eleito o foro da comarca de Chapecó/SC, ressalvado o direito do consumidor de propor ação no foro do seu domicílio.",
      ],
    },
  ],
}

// ============================================================
// POLÍTICA DE PRIVACIDADE
// ============================================================
export const PRIVACIDADE = {
  titulo: "Política de Privacidade",
  intro: [
    "Esta Política explica quais dados o Supradesk OS coleta, para que usa, com quem compartilha e quais são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).",
  ],
  secoes: [
    {
      titulo: "1. Quem é o responsável",
      paragrafos: [
        identificacao(),
        "O encarregado pelo tratamento de dados pessoais (DPO) é " + FORNECEDOR.responsavel + ", pelo e-mail " + FORNECEDOR.email + ".",
      ],
    },
    {
      titulo: "2. Dois tipos de dados, dois papéis",
      paragrafos: [
        "Dados da sua conta (quem assina o Supradesk): aqui o Supradesk é o controlador, ou seja, decide como esses dados são tratados.",
        "Dados que você cadastra sobre os seus clientes (nomes, telefones, equipamentos, anotações, senhas de Wi-Fi e acessos guardados no sistema): aqui a sua empresa é a controladora, e o Supradesk atua como operador, tratando esses dados apenas para prestar o serviço a você, conforme suas instruções.",
      ],
    },
    {
      titulo: "3. Quais dados coletamos",
      paragrafos: [
        "Cadastro: nome da empresa, e-mail e senha. A senha é guardada de forma protegida pelo serviço de autenticação e não fica visível para ninguém, nem para nós.",
        "Configurações da empresa: CPF ou CNPJ, telefone, e-mail, endereço, site e logo, que você escolhe informar para aparecer nos documentos.",
        "Pagamento: os dados do cartão são informados diretamente na Stripe. Recebemos apenas informações como status da assinatura, datas de cobrança e identificadores do cliente na Stripe.",
        "Uso do sistema: registros técnicos como data e hora de acesso, endereço IP e informações do navegador, gerados automaticamente pelos provedores de hospedagem.",
        "Conteúdo: as ordens de serviço, clientes, equipamentos, preventivas e anotações que você registra.",
      ],
    },
    {
      titulo: "4. Para que usamos e com que base legal",
      paragrafos: [
        "Prestar o serviço contratado, criar e manter sua conta, processar a assinatura e dar suporte (execução de contrato).",
        "Cumprir obrigações legais e fiscais (cumprimento de obrigação legal).",
        "Manter a segurança, prevenir fraudes e melhorar o sistema (legítimo interesse).",
        "Enviar avisos sobre a conta, cobranças e mudanças importantes. Não enviamos propaganda de terceiros e não vendemos dados.",
      ],
    },
    {
      titulo: "5. Com quem compartilhamos",
      paragrafos: [
        "Usamos fornecedores que prestam serviços essenciais ao funcionamento do sistema: Supabase (banco de dados e autenticação), Vercel (hospedagem do site) e Stripe (pagamentos). Eles só acessam os dados necessários para o serviço que prestam.",
        "Esses fornecedores podem armazenar dados em servidores fora do Brasil. Nesses casos, a transferência segue as hipóteses do artigo 33 da LGPD, com base nas garantias contratuais oferecidas por eles.",
        "Também podemos compartilhar dados quando a lei ou uma ordem judicial exigir.",
      ],
    },
    {
      titulo: "6. Como protegemos",
      paragrafos: [
        "Os dados de cada empresa ficam separados no banco de dados por regras de acesso que impedem uma conta de ver os dados de outra.",
        "Toda a comunicação com o sistema é feita por conexão criptografada (HTTPS), e o acesso administrativo ao banco é restrito.",
        "Nenhum sistema é 100% invulnerável. Se ocorrer um incidente de segurança que possa trazer risco relevante, avisaremos as pessoas afetadas e a Autoridade Nacional de Proteção de Dados (ANPD), como determina a lei.",
      ],
    },
    {
      titulo: "7. Por quanto tempo guardamos",
      paragrafos: [
        "Enquanto a conta estiver ativa. Depois do cancelamento, os dados ficam guardados por 90 dias e então são excluídos, exceto informações que a lei obrigue a manter por mais tempo, como registros financeiros e fiscais.",
      ],
    },
    {
      titulo: "8. Seus direitos",
      paragrafos: [
        "Pela LGPD, você pode pedir: confirmação de que tratamos seus dados, acesso a eles, correção, anonimização, bloqueio ou eliminação de dados desnecessários, portabilidade, informação sobre com quem compartilhamos e revisão de decisões automatizadas.",
        "Para exercer esses direitos, escreva para " + FORNECEDOR.email + ". Respondemos em até 15 dias.",
        "Se você é cliente de uma assistência técnica que usa o Supradesk, seus dados foram cadastrados por ela. Procure primeiro essa empresa; se precisar, nós ajudamos a atender o seu pedido.",
        "Você também pode registrar reclamação na ANPD (gov.br/anpd).",
      ],
    },
    {
      titulo: "9. Armazenamento no navegador",
      paragrafos: [
        "O sistema usa o armazenamento local do seu navegador para manter você conectado e lembrar preferências, como o tema claro ou escuro. Não usamos cookies de publicidade. Se isso mudar, esta Política será atualizada antes.",
      ],
    },
    {
      titulo: "10. Menores de idade",
      paragrafos: [
        "O Supradesk é destinado a empresas e profissionais. Não é feito para menores de 18 anos.",
      ],
    },
    {
      titulo: "11. Alterações desta Política",
      paragrafos: [
        "Podemos atualizar esta Política. A data da última atualização fica no topo da página, e mudanças relevantes serão avisadas por e-mail ou no sistema.",
      ],
    },
  ],
}
