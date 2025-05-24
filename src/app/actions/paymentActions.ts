
'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';
import type { Player } from '@/types/player';

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
  playerName: string | undefined,
  amount: number // Amount in BRL
): Promise<CreatePaymentPreferenceResult> {
  if (!accessToken || accessToken === "FALLBACK_TOKEN_IF_NOT_SET_NEVER_USE_IN_PROD_WITHOUT_ENV") {
    console.error('Tentativa de criar preferência de pagamento sem MP_ACCESS_TOKEN configurado.');
    return { error: 'MP_ACCESS_TOKEN não está configurado no servidor. Verifique as variáveis de ambiente para pagamentos.' };
  }

  if (!playerId || amount <= 0) {
    return { error: 'Dados inválidos para criar a preferência de pagamento.' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

  try {
    const preferenceData = await preference.create({
      body: {
        items: [
          {
            id: `recharge-saldo-${playerId}-${Date.now()}`,
            title: `Recarga de Saldo para ${playerName || playerId}`,
            quantity: 1,
            unit_price: amount, // Amount is already in BRL
            currency_id: 'BRL', 
            description: `Adiciona ${amount.toFixed(2)} BRL ao saldo do jogador ${playerName || playerId}`,
          },
        ],
        payer: {
          // email: "email_do_jogador@exemplo.com", 
        },
        back_urls: {
          success: `${baseUrl}/payment/success?playerId=${playerId}&amount=${amount}`,
          failure: `${baseUrl}/payment/failure?playerId=${playerId}`,
          pending: `${baseUrl}/payment/pending?playerId=${playerId}&amount=${amount}`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/payment-webhook`,
        external_reference: playerId, 
      },
    });

    if (preferenceData.id && preferenceData.init_point) { // Check for preferenceData.id as well
      console.log('Preferência de pagamento criada com ID:', preferenceData.id);
      return { checkoutUrl: preferenceData.init_point };
    } else {
      console.error('Mercado Pago API não retornou init_point ou ID da preferência:', preferenceData);
      return { error: 'Não foi possível iniciar o pagamento. Tente novamente mais tarde.' };
    }
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento no Mercado Pago:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao se comunicar com o Mercado Pago.';
    return { error: `Erro ao processar pagamento: ${errorMessage}` };
  }
}

