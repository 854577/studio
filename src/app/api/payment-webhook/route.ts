
// src/app/api/payment-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// IMPORTANTE: Configure seu Access Token como variável de ambiente
const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.error('ERRO CRÍTICO NO WEBHOOK: MP_ACCESS_TOKEN não está configurado.');
}
const client = new MercadoPagoConfig({ accessToken: accessToken || "FALLBACK_WEBHOOK_TOKEN" });

export async function POST(request: NextRequest) {
  console.log('Webhook do Mercado Pago recebido!');

  if (!accessToken || accessToken === "FALLBACK_WEBHOOK_TOKEN") {
    console.error('Webhook não pode processar: Access Token do MP não configurado no servidor.');
    return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log('Corpo do Webhook:', JSON.stringify(body, null, 2));

    const topic = body.type; // ou body.topic dependendo da versão da API do MP
    const paymentId = body.data?.id; // ou body.resource?.id, body.id

    if (topic === 'payment' && paymentId) {
      console.log(`Processando notificação de pagamento para o ID: ${paymentId}`);
      
      const paymentInstance = new Payment(client);
      const paymentDetails = await paymentInstance.get({ id: paymentId });

      console.log('Detalhes do Pagamento Obtidos do MP:', JSON.stringify(paymentDetails, null, 2));

      if (paymentDetails && paymentDetails.status === 'approved') {
        const playerId = paymentDetails.external_reference;
        const paidAmount = paymentDetails.transaction_amount; // Valor efetivamente pago

        if (!playerId) {
          console.error('Player ID (external_reference) não encontrado nos detalhes do pagamento.');
          return NextResponse.json({ error: 'Player ID não encontrado.' }, { status: 400 });
        }

        console.log(`Pagamento APROVADO para Player ID: ${playerId}, Valor: ${paidAmount}`);

        // ----- LÓGICA PARA ATUALIZAR O SALDO NO FIREBASE -----
        // 1. Busque os dados atuais do jogador no Firebase usando o playerId.
        // 2. Some o paidAmount ao campo 'ouro' do jogador.
        // 3. Salve os dados atualizados de volta no Firebase.

        // Exemplo de como seria a atualização (você precisará do Firebase Admin SDK aqui ou uma forma de autenticar para escrita)
        const firebaseUpdateUrl = `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`;
        
        try {
            // Primeiro, buscar o valor atual de ouro
            const playerResponse = await fetch(firebaseUpdateUrl);
            if (!playerResponse.ok) {
                throw new Error(`Falha ao buscar dados do jogador ${playerId} do Firebase: ${playerResponse.statusText}`);
            }
            const playerData = await playerResponse.json();
            const currentGold = playerData?.ouro || 0;
            const newGold = currentGold + paidAmount; // Assumindo que paidAmount é o valor em ouro

            // Atualizar o ouro no Firebase
            // IMPORTANTE: Em um ambiente de produção, use o Firebase Admin SDK para escritas seguras no backend.
            // Esta chamada fetch direta pode não funcionar dependendo das suas regras de segurança do Firebase.
            const updateResponse = await fetch(firebaseUpdateUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ouro: newGold }),
            });

            if (!updateResponse.ok) {
                const errorBody = await updateResponse.text();
                console.error(`Falha ao atualizar ouro para ${playerId} no Firebase: ${updateResponse.statusText}`, errorBody);
                throw new Error(`Falha ao atualizar ouro no Firebase: ${updateResponse.statusText}`);
            }
            console.log(`Ouro atualizado para Player ID: ${playerId}. Novo saldo: ${newGold}`);
            
        } catch (dbError) {
            console.error('Erro ao interagir com o Firebase no webhook:', dbError);
            // Mesmo que haja erro no DB, o Mercado Pago espera um 200 OK para não reenviar a notificação.
            // Você deve ter um sistema de retry/logging robusto para essas falhas de DB.
        }
        // ------------------------------------------------------

      } else {
        console.log(`Status do pagamento ${paymentId}: ${paymentDetails?.status}. Não 'approved'. Nenhuma ação de crédito.`);
      }
    } else {
      console.log('Notificação não relacionada a um pagamento ou ID do pagamento ausente.');
    }

    // Responda ao Mercado Pago com status 200 OK para confirmar o recebimento da notificação.
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    // Mesmo em caso de erro, é comum responder 200 para evitar reenvios excessivos,
    // mas logar o erro é crucial.
    return NextResponse.json({ error: 'Erro interno ao processar webhook', details: errorMessage }, { status: 200 }); // Ou 500, mas MP pode reenviar.
  }
}

// Se você precisar de GET para algum tipo de verificação (ex: configurar o webhook no MP)
export async function GET(request: NextRequest) {
  console.log("Webhook endpoint: GET request received (geralmente usado para verificação).");
  return NextResponse.json({ message: "Webhook endpoint is active. Use POST for notifications." });
}

