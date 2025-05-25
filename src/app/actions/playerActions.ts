
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
