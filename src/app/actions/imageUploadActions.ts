
'use server';

import type { Player } from '@/types/player';
import { adminUpdatePlayerFullAction } from './playerActions';
import { uploadFileToHost, deleteFileFromHost } from '@/lib/imageUploader';

interface UploadResult {
  success: boolean;
  message: string;
  newPhotoUrl?: string | null;
}

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export async function handleProfilePhotoUploadAction(
  formData: FormData,
  playerId: string
): Promise<UploadResult> {
  console.log('[imageUploadActions] Action started for playerId:', playerId);

  if (!playerId) {
    console.error('[imageUploadActions] Player ID not provided.');
    return { success: false, message: 'ID do jogador não fornecido.' };
  }

  const fileEntry = formData.get('profileImage');
  let file: File | null = null;

  if (fileEntry instanceof File) {
    file = fileEntry;
    if (file.name === "" && file.size === 0 && !file.type) {
      console.log('[imageUploadActions] Empty file input detected, treating as no file for upload for playerId:', playerId);
      file = null;
    }
  } else if (fileEntry === null || (typeof fileEntry === 'string' && (fileEntry === 'null' || fileEntry === ''))) {
    console.log('[imageUploadActions] fileEntry is null or empty string, proceeding with photo removal/no file logic for playerId:', playerId);
    file = null;
  } else if (fileEntry) {
    console.warn('[imageUploadActions] Invalid data type for profileImage for playerId:', playerId, '. Expected File or null, got:', typeof fileEntry, fileEntry);
    return { success: false, message: 'Tipo de arquivo de imagem inválido ou inesperado.' };
  }

  let oldPhotoUrl: string | null = null;
  if (playerId) {
    try {
      console.log(`[imageUploadActions] Fetching current player data for ${playerId} to get old photo URL.`);
      const playerResponse = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`);
      if (playerResponse.ok) {
        const currentPlayer: Player | null = await playerResponse.json();
        if (currentPlayer && currentPlayer.foto) {
          oldPhotoUrl = currentPlayer.foto;
          console.log(`[imageUploadActions] Found old photo URL for player ${playerId}: ${oldPhotoUrl}`);
        } else {
          console.log(`[imageUploadActions] Player ${playerId} has no current photo or player data is incomplete.`);
        }
      } else {
        console.warn(`[imageUploadActions] Could not fetch current player data for ${playerId} to get old photo URL. Status: ${playerResponse.status}`);
      }
    } catch (fetchError: any) {
      console.error(`[imageUploadActions] Error fetching current player data for ${playerId}:`, fetchError.message || fetchError);
      // Non-critical for photo upload/removal, proceed without oldPhotoUrl if fetch fails
    }
  }

  if (file) { // UPLOAD NEW FILE
    try {
      console.log('[imageUploadActions] File received for upload for playerId:', playerId, file.name, file.size, file.type);

      if (file.size > MAX_FILE_SIZE_BYTES) {
        console.error(`[imageUploadActions] File size exceeds 1MB limit for playerId: ${playerId}. Size: ${file.size} bytes.`);
        return { success: false, message: `Arquivo da imagem excede o limite de 1MB.` };
      }

      if (!file.type.startsWith('image/')) {
        console.error('[imageUploadActions] Invalid file type for playerId:', playerId, file.type);
        return { success: false, message: 'Arquivo inválido, selecione uma imagem.' };
      }

      let fileBuffer: Buffer;
      try {
        console.log('[imageUploadActions] Converting file to buffer for playerId:', playerId);
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        console.log(`[imageUploadActions] File buffer created for playerId ${playerId}, size: ${fileBuffer.length}`);
      } catch (bufferError: any) {
        console.error(`[imageUploadActions] Error converting file to buffer for playerId ${playerId}:`, bufferError.message || bufferError);
        return { success: false, message: 'Falha ao processar o arquivo de imagem.' };
      }

      console.log('[imageUploadActions] Attempting to upload file to host for playerId:', playerId);
      const newImageUrl = await uploadFileToHost(fileBuffer, file.name, file.type);
      console.log(`[imageUploadActions] Image URL from host for playerId ${playerId}: ${newImageUrl}`);

      if (!newImageUrl || typeof newImageUrl !== 'string' || !(newImageUrl.startsWith('http://') || newImageUrl.startsWith('https://'))) {
        console.error('[imageUploadActions] Invalid image URL received from host for playerId:', playerId, newImageUrl);
        return { success: false, message: 'URL da imagem inválida do serviço de upload.' };
      }
      
      if (oldPhotoUrl && oldPhotoUrl !== newImageUrl) {
        try {
          console.log(`[imageUploadActions] Attempting to delete old photo: ${oldPhotoUrl} for player ${playerId}`);
          await deleteFileFromHost(oldPhotoUrl);
          console.log(`[imageUploadActions] Deletion attempt for ${oldPhotoUrl} called successfully.`);
        } catch (deleteError: any) {
          console.error(`[imageUploadActions] Non-critical: Failed to delete old photo ${oldPhotoUrl} for player ${playerId}:`, deleteError.message || deleteError);
          // Do not block update if deletion fails, just log it.
        }
      }

      console.log(`[imageUploadActions] Updating player ${playerId} with foto: ${newImageUrl}`);
      const updateResult = await adminUpdatePlayerFullAction(playerId, { foto: newImageUrl });
      console.log(`[imageUploadActions] Firebase update result for playerId ${playerId}:`, updateResult);

      if (updateResult.success) {
        return {
          success: true,
          message: 'Foto de perfil atualizada com sucesso!',
          newPhotoUrl: newImageUrl,
        };
      } else {
        console.error('[imageUploadActions] Firebase update failed for playerId:', playerId, 'Details:', updateResult.message);
        return {
          success: false,
          message: updateResult.message || 'Falha ao salvar foto no perfil do jogador.',
        };
      }
    } catch (error: any) {
      console.error(`[imageUploadActions] CRITICAL ERROR during new photo upload for playerId ${playerId}:`, error.message || error);
      // Check if it's the "not implemented" error specifically, otherwise generic.
      if (typeof error.message === 'string' && error.message.includes('Funcionalidade de upload de imagem não implementada')) {
        return { success: false, message: 'A funcionalidade de upload de fotos ainda não está configurada pelo administrador do site.' };
      }
      return { success: false, message: 'Falha crítica no servidor ao processar upload. Verifique os logs do servidor.' };
    }
  } else { // NO NEW FILE - EITHER REMOVING PHOTO OR NO FILE WAS SELECTED
    try {
      console.log('[imageUploadActions] No file provided or explicit removal, attempting to remove photo for playerId:', playerId);
      if (oldPhotoUrl) {
        try {
          console.log(`[imageUploadActions] Attempting to delete old photo (as part of removal): ${oldPhotoUrl} for player ${playerId}`);
          await deleteFileFromHost(oldPhotoUrl);
          console.log(`[imageUploadActions] Deletion attempt for ${oldPhotoUrl} called successfully.`);
        } catch (deleteError: any) {
          console.error(`[imageUploadActions] Non-critical: Failed to delete old photo ${oldPhotoUrl} during removal for player ${playerId}:`, deleteError.message || deleteError);
          // Do not block update if deletion fails, just log it.
        }
      }
    
      console.log(`[imageUploadActions] Updating player ${playerId} to remove photo (foto: null).`);
      const removeResult = await adminUpdatePlayerFullAction(playerId, { foto: null });
      if (removeResult.success) {
        console.log('[imageUploadActions] Photo removed successfully from Firebase for playerId:', playerId);
        return { success: true, message: 'Foto de perfil removida.', newPhotoUrl: null };
      } else {
        console.error('[imageUploadActions] Failed to remove photo from Firebase for playerId:', playerId, 'Details:', removeResult.message);
        return { success: false, message: removeResult.message || 'Falha ao remover foto do perfil do Firebase.' };
      }
    } catch (error: any) {
      console.error('[imageUploadActions] Error during photo removal from Firebase for playerId (adminUpdatePlayerFullAction failed):', playerId, error.message || error);
      return {
        success: false,
        message: 'Erro crítico no servidor ao processar remoção da foto. Verifique os logs do servidor.'
      };
    }
  }
}
