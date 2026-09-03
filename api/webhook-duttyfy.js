// api/webhook-duttyfy.js
// Configure esta URL em: painel Duttyfy → Integrações e Chaves → Webhooks
// Ex: https://seusite.com/api/webhook-duttyfy
//
// A Duttyfy envia POST aqui quando o status muda:
//  - PENDING: cobrança gerada
//  - COMPLETED: pagamento confirmado (é o que te interessa)
//
// Pontos importantes (conforme a doc que você mandou):
//  - "items" vem como OBJETO, não array.
//  - "paidAt" NÃO existe no payload do webhook.
//  - Em COMPLETED pode não vir "transactionId" — use "_id.$oid" como chave.
//  - Trate cada transactionId/_id só UMA vez (idempotência).
//  - Responda 2xx rápido (menos de 5s) pra evitar reenvios.

const processedIds = new Set(); // troque por um banco de dados em produção

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const payload = req.body || {};
  const id = payload.transactionId || payload._id?.$oid;

  if (!id) {
    return res.status(400).json({ error: 'Payload sem identificador' });
  }

  // Responde rápido primeiro, processa depois (evita retries desnecessários)
  res.status(200).json({ received: true });

  if (payload.status === 'COMPLETED') {
    if (processedIds.has(id)) return; // já processado, ignora
    processedIds.add(id);

    // >>> AQUI: libere o acesso do cliente <<<
    // Ex.: marcar pedido como pago no seu banco, enviar e-mail com o link
    // do produto, liberar acesso na sua área de membros, etc.
    console.log('Pagamento confirmado:', id, payload.customer?.email);
  }
}
