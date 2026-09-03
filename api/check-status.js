// api/check-status.js
// GET /api/check-status?transactionId=xxxx
// Fallback de polling. O ideal é usar webhook (veja README), mas isso
// cobre o caso de o webhook ainda não estar configurado.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const DUTTYFY_URL = process.env.DUTTYFY_URL;
  if (!DUTTYFY_URL) {
    return res.status(500).json({ error: 'DUTTYFY_URL não configurada no servidor' });
  }

  const { transactionId } = req.query;
  if (!transactionId) {
    return res.status(400).json({ error: 'transactionId é obrigatório' });
  }

  try {
    const url = `${DUTTYFY_URL}?transactionId=${encodeURIComponent(transactionId)}`;
    const duttyfyRes = await fetch(url, { method: 'GET' });
    const data = await duttyfyRes.json();

    if (!duttyfyRes.ok) {
      return res.status(duttyfyRes.status).json(data);
    }

    return res.status(200).json(data); // { status: "PENDING" | "COMPLETED", paidAt? }
  } catch (err) {
    console.error('Erro ao consultar status:', err);
    return res.status(500).json({ error: 'Erro interno ao consultar status' });
  }
}
