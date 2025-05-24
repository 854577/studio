
'use server';

import type { Player } from '@/types/player';

const FIREBASE_URL = 'https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios';

interface PurchaseResult {
  success: boolean;
  message: string;
  newOuro?: number;
  updatedInventory?: Record<string, number>;
}

export async function purchaseItemAction(
  playerId: string,
  itemName: string,
  itemPrice: number
): Promise<PurchaseResult> {
  if (!playerId || !itemName || typeof itemPrice !== 'number' || itemPrice <= 0) {
    return { success: false, message: 'Dados da compra inválidos.' };
  }

  const playerUrl = `${FIREBASE_URL}/${playerId}.json`;

  try {
    // 1. Buscar dados atuais do jogador
    const playerResponse = await fetch(playerUrl);
    if (!playerResponse.ok) {
      if (playerResponse.status === 404) {
        return { success: false, message: `Jogador com ID "${playerId}" não encontrado.` };
      }
      const errorText = await playerResponse.text();
      console.error(`Falha ao buscar jogador ${playerId} do Firebase: ${playerResponse.status} ${errorText}`);
      return { success: false, message: `Erro ao buscar dados do jogador: ${playerResponse.statusText}` };
    }

    const playerData: Player | null = await playerResponse.json();

    if (!playerData) {
      return { success: false, message: `Jogador com ID "${playerId}" não encontrado ou dados inválidos.` };
    }

    // 2. Verificar se o jogador tem ouro suficiente
    const currentOuro = playerData.ouro || 0;
    if (currentOuro < itemPrice) {
      return { success: false, message: `Ouro insuficiente. Você tem ${currentOuro}, precisa de ${itemPrice}.` };
    }

    // 3. Atualizar ouro e inventário
    const newOuro = currentOuro - itemPrice;
    const newInventory = { ...(playerData.inventario || {}) };
    newInventory[itemName] = (newInventory[itemName] || 0) + 1;

    // 4. Fazer PATCH no Firebase com os novos dados
    const updateResponse = await fetch(playerUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ouro: newOuro, inventario: newInventory }),
    });

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.text();
      console.error(`Falha ao atualizar dados para ${playerId} no Firebase: ${updateResponse.statusText}`, errorBody);
      return { success: false, message: `Erro ao salvar compra no banco de dados: ${updateResponse.statusText}` };
    }

    return {
      success: true,
      message: `Você comprou ${itemName} por ${itemPrice} de ouro!`,
      newOuro: newOuro,
      updatedInventory: newInventory,
    };

  } catch (error) {
    console.error(`Erro ao processar compra para ${playerId}, item ${itemName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar a compra.';
    return { success: false, message: `Erro no servidor: ${errorMessage}` };
  }
}
