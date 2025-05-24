
'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';
import type { Player } from '@/types/player';

// IMPORTANTE: Seu Access Token NUNCA deve ser exposto no frontend.
// Configure-o como uma variável de ambiente no seu servidor.
// Ex: Em um arquivo .env.local na raiz do projeto:
// MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AQUI
const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.error('ERRO CRÍTICO: MP_ACCESS_TOKEN não está configurado no ambiente do servidor.');
}

const client = new MercadoPagoConfig({ accessToken: accessToken || "FALLBACK_TOKEN_IF_NOT_SET_NEVER_USE_IN_PROD_WITHOUT_ENV" });
const preference = new Preference(client);

interface CreatePaymentPreferenceResult {
  checkoutUrl?: string;
  error?: string;
}

export async function createPaymentPreference(
  playerId: string,
  playerName: string | undefined, // Adicionado para descrição do item
  amount: number
): Promise<CreatePaymentPreferenceResult> {
  if (!accessToken || accessToken === "FALLBACK_TOKEN_IF_NOT_SET_NEVER_USE_IN_PROD_WITHOUT_ENV") {
    return { error: 'A configuração do servidor para pagamentos está incompleta. Contate o administrador.' };
  }

  if (!playerId || amount <= 0) {
    return { error: 'Dados inválidos para criar a preferência de pagamento.' };
  }

  // Construa as URLs absolutas para back_urls e notification_url
  // Em produção, use o domínio real do seu site.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

  try {
    const preferenceData = await preference.create({
      body: {
        items: [
          {
            id: `recharge-${playerId}-${Date.now()}`,
            title: `Recarga de Ouro para ${playerName || playerId}`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL', // Moeda (Real Brasileiro)
            description: `Recarga de ${amount} BRL em ouro para o jogador ${playerName || playerId}`,
          },
        ],
        payer: { // Opcional, mas pode ser útil
          // email: "email_do_jogador@exemplo.com", // Se você tiver o email do jogador
        },
        back_urls: {
          success: `${baseUrl}/payment/success?playerId=${playerId}&amount=${amount}`,
          failure: `${baseUrl}/payment/failure?playerId=${playerId}`,
          pending: `${baseUrl}/payment/pending?playerId=${playerId}`, // Opcional
        },
        auto_return: 'approved', // Retorna automaticamente para a success URL se aprovado
        notification_url: `${baseUrl}/api/payment-webhook`, // IMPORTANTE: Você precisará implementar este endpoint (webhook)
        external_reference: playerId, // Referência externa para identificar o jogador no webhook
      },
    });

    if (preferenceData.init_point) {
      return { checkoutUrl: preferenceData.init_point };
    } else {
      console.error('Mercado Pago API não retornou init_point:', preferenceData);
      return { error: 'Não foi possível iniciar o pagamento. Tente novamente mais tarde.' };
    }
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento no Mercado Pago:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao se comunicar com o Mercado Pago.';
    return { error: `Erro ao processar pagamento: ${errorMessage}` };
  }
}
