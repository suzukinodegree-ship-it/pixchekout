// api/create-pix.js
// Vercel: coloque este arquivo em /api/create-pix.js na raiz do projeto.
// Netlify: adapte para /netlify/functions/create-pix.js (o handler muda um pouco).
//
// IMPORTANTE: a URL encriptada da Duttyfy NUNCA deve aparecer no front-end.
// Ela fica só aqui, lida de uma variável de ambiente do servidor.
//
// Configure na Vercel (Settings → Environment Variables):
//   DUTTYFY_URL = https://www.links-pagamentos.online/api-pix/TeeJChSSakCQjN1Kx1ysHpm58VNRduu5XedoYLGKQ93-I_zT7Nz9Bi8p0mpHQ1FLHqlRWdq2Z8AWxfse-VOh9A

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const DUTTYFY_URL = process.env.DUTTYFY_URL;
  if (!DUTTYFY_URL) {
    return res.status(500).json({ error: 'DUTTYFY_URL não configurada no servidor' });
  }

  try {
    const { amount, description, customer, item, utm } = req.body || {};

    // Validações mínimas antes de repassar pra API
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Valor mínimo de R$ 1,00' });
    }
    if (!customer?.name || !customer?.document || !customer?.email) {
      return res.status(400).json({ error: 'Dados do cliente incompletos' });
    }

    // A Duttyfy exige phone no payload, mas o formulário não coleta
    // telefone. Preenchemos aqui com um valor padrão só pra satisfazer
    // o campo obrigatório — não é usado para contato real.
    const DEFAULT_PHONE = '11000000000';

    const payload = {
      amount, // em centavos
      description: description || 'Pagamento via Pix',
      customer: {
        name: customer.name,
        document: String(customer.document).replace(/\D/g, ''), // só números
        email: customer.email,
        phone: customer.phone ? String(customer.phone).replace(/\D/g, '') : DEFAULT_PHONE,
      },
      item: item || { title: description || 'Produto', price: amount, quantity: 1 },
      paymentMethod: 'PIX',
      utm: utm || '',
    };

    const duttyfyRes = await fetch(DUTTYFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await duttyfyRes.json();

    if (!duttyfyRes.ok) {
      return res.status(duttyfyRes.status).json(data);
    }

    // Repassa só o necessário pro front (pixCode + transactionId)
    return res.status(200).json({
      pixCode: data.pixCode,
      transactionId: data.transactionId,
      status: data.status,
    });
  } catch (err) {
    console.error('Erro ao criar PIX:', err);
    return res.status(500).json({ error: 'Erro interno ao gerar o PIX' });
  }
}
