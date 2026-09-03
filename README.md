# Integração PIX (Duttyfy) na Landing Page

## ⚠️ Primeiro passo: proteja sua chave

Você compartilhou sua URL encriptada nesta conversa. Trate-a como uma senha:
- **Nunca** cole ela em código que roda no navegador (front-end).
- Se desconfiar que ela pode ter vazado, gere uma nova em **Integrações e Chaves → Gerar URL encriptada** no painel da Duttyfy e desative a antiga.

## Como funciona

```
Cliente clica no botão
        ↓
Front-end (checkout.html) chama SEU backend (/api/create-pix)
        ↓
Backend chama a Duttyfy usando a URL encriptada (guardada em variável de ambiente)
        ↓
Backend devolve pro front só o pixCode + transactionId
        ↓
Front mostra QR Code e faz polling em /api/check-status
        ↓
Duttyfy também envia webhook pra /api/webhook-duttyfy quando o pagamento é confirmado
(essa é a fonte primária — o polling é só um fallback)
```

## Deploy (exemplo com Vercel, é o caminho mais simples)

1. Crie um projeto com esta estrutura:
   ```
   /api/create-pix.js
   /api/check-status.js
   /api/webhook-duttyfy.js
   /public/checkout.html   (ou index.html na raiz)
   ```
2. Suba pro GitHub e importe o repositório em vercel.com.
3. Em **Settings → Environment Variables**, adicione:
   ```
   DUTTYFY_URL = https://www.links-pagamentos.online/api-pix/SEU_TOKEN_AQUI
   ```
4. Faça o deploy.
5. No painel da Duttyfy, em **Integrações e Chaves → Webhooks**, configure:
   ```
   https://seu-dominio.vercel.app/api/webhook-duttyfy
   ```

## O que ajustar no `checkout.html`

- `AMOUNT_CENTS`: valor da oferta em centavos (4700 = R$ 47,00).
- `PRODUCT_TITLE`: nome do produto/oferta.
- O CSS/copy do card e do modal — deixei próximo do print que você mandou, mas é só um ponto de partida visual.

## Pontos da documentação da Duttyfy que o código já respeita

- `items` no payload do webhook é **objeto**, não array.
- `paidAt` não existe no webhook — só aparece no endpoint de consulta de status (GET).
- Em `COMPLETED`, pode faltar `transactionId` — por isso o webhook usa `_id.$oid` como chave alternativa.
- Idempotência: o webhook só processa cada transação uma vez (`processedIds`) — troque isso por uma tabela no seu banco de dados em produção, já que um `Set` em memória se perde a cada novo deploy/instância.
- CPF só números, telefone com DDD só números — o backend já limpa isso antes de enviar.
