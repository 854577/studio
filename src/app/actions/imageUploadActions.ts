
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
      console.log('[imageUploadActions] Empty file input detected, treating as no file for upload.');
      file = null;
    }
  } else if (fileEntry === null || (typeof fileEntry === 'string' && (fileEntry === 'null' || fileEntry === ''))) {
    console.log('[imageUploadActions] fileEntry is null or empty string, proceeding with photo removal/no file logic.');
    file = null;
  } else if (fileEntry) {
    console.warn('[imageUploadActions] Invalid data type for profileImage. Expected File or null, got:', typeof fileEntry, fileEntry);
    return { success: false, message: 'Tipo de arquivo de imagem inválido ou inesperado.' };
  }

  // Fetch current player data to get old photo URL
  let oldPhotoUrl: string | null = null;
  if (playerId) {
    try {
      const playerResponse = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${playerId}.json`);
      if (playerResponse.ok) {
        const currentPlayer: Player | null = await playerResponse.json();
        if (currentPlayer && currentPlayer.foto) {
          oldPhotoUrl = currentPlayer.foto;
          console.log(`[imageUploadActions] Found old photo URL for player ${playerId}: ${oldPhotoUrl}`);
        }
      } else {
        console.warn(`[imageUploadActions] Could not fetch current player data for ${playerId} to get old photo URL. Status: ${playerResponse.status}`);
      }
    } catch (fetchError) {
      console.error(`[imageUploadActions] Error fetching current player data for ${playerId}:`, fetchError);
      // Non-critical, proceed without oldPhotoUrl if fetch fails
    }
  }


  // If a new file is provided for upload
  if (file) {
    console.log('[imageUploadActions] File received for upload:', file.name, file.size, file.type);

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
    } catch (bufferError) {
      const errorMessage = bufferError instanceof Error ? bufferError.message : 'Erro desconhecido na conversão.';
      console.error(`[imageUploadActions] Error converting file to buffer for playerId ${playerId}:`, errorMessage);
      return { success: false, message: `Falha ao processar o arquivo: ${errorMessage.substring(0, 100)}` };
    }

    try {
      console.log('[imageUploadActions] Uploading file to host for playerId:', playerId);
      const newImageUrl = await uploadFileToHost(fileBuffer, file.name, file.type);
      console.log(`[imageUploadActions] Image URL from host for playerId ${playerId}: ${newImageUrl}`);

      if (!newImageUrl || typeof newImageUrl !== 'string' || !(newImageUrl.startsWith('http://') || newImageUrl.startsWith('https://'))) {
        console.error('[imageUploadActions] Invalid image URL received from host:', newImageUrl);
        return { success: false, message: 'URL da imagem inválida do servidor de upload.' };
      }
      
      // If upload of new image is successful and there was an old photo, attempt to delete old one
      if (oldPhotoUrl && oldPhotoUrl !== newImageUrl) {
        try {
          console.log(`[imageUploadActions] Attempting to delete old photo: ${oldPhotoUrl} for player ${playerId}`);
          await deleteFileFromHost(oldPhotoUrl);
          console.log(`[imageUploadActions] Placeholder deletion for ${oldPhotoUrl} called successfully.`);
        } catch (deleteError) {
          console.error(`[imageUploadActions] Failed to delete old photo ${oldPhotoUrl} for player ${playerId}:`, deleteError);
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
          message: `Falha ao salvar foto no perfil: ${updateResult.message.substring(0, 100)}`,
        };
      }
    } catch (uploadOrDbError: any) {
      console.error(`[imageUploadActions] CRITICAL ERROR during new photo upload (upload/DB stage) for playerId: ${playerId}:`, uploadOrDbError);
      if (uploadOrDbError.message && uploadOrDbError.message.includes('Funcionalidade de upload de imagem não implementada')) {
        return {
          success: false,
          message: 'A funcionalidade de upload de fotos ainda não está configurada pelo administrador do site.'
        };
      }
      const errorMessage = uploadOrDbError instanceof Error ? uploadOrDbError.message : 'Erro desconhecido no upload/DB.';
      return {
        success: false,
        message: `Falha crítica no upload da foto: ${errorMessage.substring(0, 150)}`
      };
    }
  }
  // Else, if no new file is provided (meaning user wants to remove the photo)
  else {
    console.log('[imageUploadActions] No file provided or explicit removal, attempting to remove photo for playerId:', playerId);
    if (oldPhotoUrl) {
      try {
        console.log(`[imageUploadActions] Attempting to delete old photo (as part of removal): ${oldPhotoUrl} for player ${playerId}`);
        await deleteFileFromHost(oldPhotoUrl);
        console.log(`[imageUploadActions] Placeholder deletion for ${oldPhotoUrl} called successfully.`);
      } catch (deleteError) {
        console.error(`[imageUploadActions] Failed to delete old photo ${oldPhotoUrl} during removal for player ${playerId}:`, deleteError);
        // Do not block update if deletion fails, just log it.
      }
    }
    
    try {
      const removeResult = await adminUpdatePlayerFullAction(playerId, { foto: null });
      if (removeResult.success) {
        console.log('[imageUploadActions] Photo removed successfully from Firebase for playerId:', playerId);
        return { success: true, message: 'Foto de perfil removida.', newPhotoUrl: null };
      } else {
        console.error('[imageUploadActions] Failed to remove photo from Firebase for playerId:', playerId, 'Details:', removeResult.message);
        return { success: false, message: 'Falha ao remover foto do perfil do Firebase.' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar remoção do Firebase.';
      console.error('[imageUploadActions] Error during photo removal from Firebase for playerId (adminUpdatePlayerFullAction failed):', playerId, errorMessage);
      return {
        success: false,
        message: `Erro ao processar remoção da foto do Firebase: ${errorMessage.substring(0, 100)}`
      };
    }
  }
}
