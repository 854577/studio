
'use server';

import type { Player } from '@/types/player';
import { itemDetails as allShopItemsData } from '../loja/lojaData'; // Renomeado para evitar conflito


export async function purchaseItemAction(
  playerId: string,
  itemName: string,
  itemPrice: number // Preço passado para garantir consistência, mas idealmente seria pego do servidor
): Promise<{ success: boolean; message: string; updatedPlayer?: Player }> {
  if (!playerId || !itemName || itemPrice === undefined) {
    return { success: false, message: 'Dados da compra inválidos.' };
  }

  try {
    // 1. Buscar dados atuais do jogador
    const playerResponse = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`);
    if (!playerResponse.ok) {
      throw new Error(`Falha ao buscar dados do jogador: ${playerResponse.statusText}`);
    }
    const playerData: Player | null = await playerResponse.json();

    if (!playerData) {
      return { success: false, message: 'Jogador não encontrado.' };
    }

    // Verificar se o item existe na lista de itens da loja (opcional, mas bom para validação)
    const itemData = allShopItemsData[itemName.toLowerCase()];
    if (!itemData) {
        return { success: false, message: `Item "${itemName}" não encontrado na loja.` };
    }
    // Usar o preço do servidor para segurança, mas o preço do cliente (itemPrice) já foi passado
    const actualItemPrice = itemData.price;


    // 2. Verificar se o jogador tem ouro suficiente
    const currentGold = playerData.ouro || 0;
    if (currentGold < actualItemPrice) {
      return { success: false, message: 'Ouro insuficiente para comprar este item.' };
    }

    // 3. Deduzir ouro e adicionar item ao inventário
    const newGold = currentGold - actualItemPrice;
    const newInventory = { ...(playerData.inventario || {}) };
    newInventory[itemName] = (newInventory[itemName] || 0) + 1;

    // 4. Atualizar dados no Firebase
    const updatePayload = {
      ouro: newGold,
      inventario: newInventory,
    };

    const firebaseResponse = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    if (!firebaseResponse.ok) {
      // Tentar obter mais detalhes do erro do Firebase
      let errorDetail = `Status: ${firebaseResponse.status} - ${firebaseResponse.statusText}`;
      try {
        const errorData = await firebaseResponse.json();
        if (errorData && errorData.error) {
          errorDetail = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
      } catch (e) { /* ignore parsing error */ }
      throw new Error(`Falha ao salvar compra no Firebase: ${errorDetail}`);
    }
    
    const updatedPlayer = { ...playerData, ouro: newGold, inventario: newInventory };

    return { 
      success: true, 
      message: `${itemName} comprado com sucesso!`,
      updatedPlayer 
    };

  } catch (error) {
    console.error('Erro na compra do item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao processar a compra.';
    return { success: false, message: errorMessage };
  }
}
