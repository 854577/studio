
'use server';

import type { Player } from '@/types/player';

interface UpdateResult {
  success: boolean;
  message: string;
  updatedPlayer?: Partial<Player>; // Only include fields that changed or are relevant
}

export async function updatePlayerNameAction(
  playerId: string,
  newName: string
): Promise<UpdateResult> {
  if (!playerId || !newName.trim()) {
    return { success: false, message: 'ID do jogador e novo nome são obrigatórios.' };
  }

  try {
    const updatePayload = { nome: newName.trim() };

    const firebaseResponse = await fetch(
      `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!firebaseResponse.ok) {
      let errorDetail = `Status: ${firebaseResponse.status} - ${firebaseResponse.statusText}`;
      try {
        const errorData = await firebaseResponse.json();
        if (errorData && errorData.error) {
          errorDetail = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
      } catch (e) { /* ignore parsing error */ }
      throw new Error(`Falha ao atualizar nome no Firebase: ${errorDetail}`);
    }

    return {
      success: true,
      message: 'Nome atualizado com sucesso!',
      updatedPlayer: { nome: newName.trim() },
    };
  } catch (error) {
    console.error('Erro ao atualizar nome:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao atualizar o nome.';
    return { success: false, message: errorMessage };
  }
}

export async function updatePlayerPasswordAction(
  playerId: string,
  newPassword: string
): Promise<UpdateResult> {
  if (!playerId || !newPassword) {
    return { success: false, message: 'ID do jogador e nova senha são obrigatórios.' };
  }
  if (newPassword.length < 4) { // Exemplo de validação simples de senha
    return { success: false, message: 'A nova senha deve ter pelo menos 4 caracteres.' };
  }

  try {
    const updatePayload = { senha: newPassword };

    const firebaseResponse = await fetch(
      `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!firebaseResponse.ok) {
      let errorDetail = `Status: ${firebaseResponse.status} - ${firebaseResponse.statusText}`;
      try {
        const errorData = await firebaseResponse.json();
        if (errorData && errorData.error) {
          errorDetail = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
      } catch (e) { /* ignore parsing error */ }
      throw new Error(`Falha ao atualizar senha no Firebase: ${errorDetail}`);
    }

    return {
      success: true,
      message: 'Senha atualizada com sucesso!',
      updatedPlayer: { senha: newPassword },
    };
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao atualizar a senha.';
    return { success: false, message: errorMessage };
  }
}

export async function adminUpdatePlayerFullAction(
  playerId: string,
  updates: Partial<Player>
): Promise<UpdateResult> {
  if (!playerId) {
    return { success: false, message: 'ID do jogador é obrigatório.' };
  }
  if (Object.keys(updates).length === 0) {
    return { success: false, message: 'Nenhuma atualização fornecida.' };
  }

  // Sanitize numeric fields that might come as strings from inputs
  const sanitizedUpdates: Partial<Player> = { ...updates };
  const numericFields: (keyof Player)[] = ['vida', 'ouro', 'nivel', 'xp', 'energia', 'mana'];
  numericFields.forEach(field => {
    if (sanitizedUpdates[field] !== undefined && typeof sanitizedUpdates[field] === 'string') {
      const numValue = parseInt(sanitizedUpdates[field] as string, 10);
      if (!isNaN(numValue)) {
        sanitizedUpdates[field] = numValue;
      } else {
        // Keep as is or set to undefined/null if invalid, depends on desired behavior
        // For now, let's assume it might be an intentional string or handle it later
      }
    }
  });

  // Sanitize inventory quantities
  if (sanitizedUpdates.inventario) {
    const sanitizedInventory: Record<string, number> = {};
    for (const itemKey in sanitizedUpdates.inventario) {
      const quantity = sanitizedUpdates.inventario[itemKey];
      if (typeof quantity === 'string') {
        const numQuantity = parseInt(quantity, 10);
        if (!isNaN(numQuantity) && numQuantity >= 0) {
          sanitizedInventory[itemKey] = numQuantity;
        }
        // If quantity is invalid or zero, it effectively removes the item if it was zero.
        // Or you might want to keep it if it was an invalid string, depends on strictness.
      } else if (typeof quantity === 'number' && quantity >= 0) {
        sanitizedInventory[itemKey] = quantity;
      }
    }
    // Filter out items with zero quantity
    for (const itemKey in sanitizedInventory) {
        if (sanitizedInventory[itemKey] === 0) {
            delete sanitizedInventory[itemKey];
        }
    }
    sanitizedUpdates.inventario = sanitizedInventory;
  }


  try {
    const firebaseResponse = await fetch(
      `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`,
      {
        method: 'PATCH', // Use PATCH to update only specified fields
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedUpdates),
      }
    );

    if (!firebaseResponse.ok) {
      let errorDetail = `Status: ${firebaseResponse.status} - ${firebaseResponse.statusText}`;
      try {
        const errorData = await firebaseResponse.json();
        if (errorData && errorData.error) {
          errorDetail = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
      } catch (e) { /* ignore parsing error */ }
      throw new Error(`Falha ao atualizar dados do jogador no Firebase: ${errorDetail}`);
    }
    
    // Firebase PATCH returns the updated data for the patched fields
    const responseData = await firebaseResponse.json();

    return {
      success: true,
      message: 'Dados do jogador atualizados com sucesso!',
      updatedPlayer: responseData, // Return the fields that were actually updated by Firebase
    };
  } catch (error) {
    console.error('Erro ao atualizar dados completos do jogador:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao atualizar os dados do jogador.';
    return { success: false, message: errorMessage };
  }
}
