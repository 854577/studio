
// src/app/api/payment-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.error('ERRO CRÍTICO NO WEBHOOK: MP_ACCESS_TOKEN não está configurado. Para desenvolvimento local, crie um arquivo .env.local na raiz do projeto e adicione MP_ACCESS_TOKEN=SEU_TOKEN_AQUI. Em produção, configure esta variável no seu ambiente de hospedagem.');
}
const client = new MercadoPagoConfig({ accessToken: accessToken || "FALLBACK_WEBHOOK_TOKEN" });
const paymentInstance = new Payment(client);

export async function POST(request: NextRequest) {
  console.log('Webhook do Mercado Pago recebido!');

  if (!accessToken || accessToken === "FALLBACK_WEBHOOK_TOKEN") {
    const errorMessage = 'Webhook não pode processar: MP_ACCESS_TOKEN não está configurado no servidor. Para desenvolvimento local, crie um arquivo .env.local na raiz do projeto e adicione MP_ACCESS_TOKEN=SEU_TOKEN_AQUI. Em produção, configure esta variável de ambiente no seu servidor de hospedagem.';
    console.error(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log('Corpo do Webhook:', JSON.stringify(body, null, 2));

    const topic = body.type; 
    const paymentId = body.data?.id;

    if (topic === 'payment' && paymentId) {
      console.log(`Processando notificação de pagamento para o ID: ${paymentId}`);
      
      const paymentDetails = await paymentInstance.get({ id: paymentId });

      console.log('Detalhes do Pagamento Obtidos do MP:', JSON.stringify(paymentDetails, null, 2));

      if (paymentDetails && paymentDetails.status === 'approved') {
        const playerId = paymentDetails.external_reference;
        const paidAmount = paymentDetails.transaction_amount; // Valor efetivamente pago em BRL

        if (!playerId) {
          console.error('Player ID (external_reference) não encontrado nos detalhes do pagamento.');
          // Ainda retornar 200 OK para o MP não reenviar, mas logar o erro.
          return NextResponse.json({ error: 'Player ID não encontrado nos dados do pagamento.' }, { status: 200 });
        }
        if (typeof paidAmount !== 'number' || paidAmount <= 0) {
            console.error(`Valor pago inválido (${paidAmount}) para o pagamento ID: ${paymentId}.`);
            return NextResponse.json({ error: 'Valor pago inválido.' }, { status: 200 });
        }

        console.log(`Pagamento APROVADO para Player ID: ${playerId}, Valor: ${paidAmount} BRL`);

        const firebaseUpdateUrl = `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`;
        
        try {
            const playerResponse = await fetch(firebaseUpdateUrl);
            if (!playerResponse.ok) {
                const errorText = await playerResponse.text();
                console.error(`Falha ao buscar dados do jogador ${playerId} do Firebase: ${playerResponse.status} ${playerResponse.statusText}`, errorText);
                throw new Error(`Falha ao buscar dados do jogador ${playerId} do Firebase: ${playerResponse.statusText}`);
            }
            const playerData = await playerResponse.json();
            // Se playerData for null (jogador não existe), não podemos prosseguir
            if (playerData === null) {
                 console.error(`Jogador com ID ${playerId} não encontrado no Firebase. Não é possível creditar saldo.`);
                 // Responder 200 OK para o MP, mas logar o problema.
                 return NextResponse.json({ error: `Jogador ${playerId} não encontrado no Firebase.` }, { status: 200 });
            }

            const currentSaldo = playerData?.saldoBRL || 0;
            const newSaldo = currentSaldo + paidAmount;

            const updateResponse = await fetch(firebaseUpdateUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saldoBRL: parseFloat(newSaldo.toFixed(2)) }),
            });

            if (!updateResponse.ok) {
                const errorBody = await updateResponse.text();
                console.error(`Falha ao atualizar saldoBRL para ${playerId} no Firebase: ${updateResponse.statusText}`, errorBody);
                throw new Error(`Falha ao atualizar saldoBRL no Firebase: ${updateResponse.statusText}`);
            }
            console.log(`Saldo BRL atualizado para Player ID: ${playerId}. Novo saldo: ${newSaldo.toFixed(2)}`);
            
        } catch (dbError) {
            console.error(`Erro ao interagir com o Firebase para o jogador ${playerId} no webhook:`, dbError);
            return NextResponse.json({ error: 'Erro interno ao atualizar banco de dados.', details: (dbError as Error).message }, { status: 200 });
        }
      } else {
        console.log(`Status do pagamento ${paymentId}: ${paymentDetails?.status}. Não 'approved'. Nenhuma ação de crédito de saldo.`);
      }
    } else {
      console.log('Notificação não relacionada a um pagamento ou ID do pagamento ausente. Tipo:', topic, "ID:", paymentId);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Erro FATAL ao processar webhook do Mercado Pago:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    return NextResponse.json({ error: 'Erro interno ao processar webhook', details: errorMessage }, { status: 200 }); // Ou 500, mas MP pode reenviar.
  }
}

export async function GET(request: NextRequest) {
  console.log("Webhook endpoint: GET request received (geralmente usado para verificação).");
  return NextResponse.json({ message: "Webhook endpoint is active. Use POST for notifications." });
}
