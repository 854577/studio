
'use server';

import type { Player } from '@/types/player';
import { adminUpdatePlayerFullAction } from './playerActions';
import { uploadFileToHost } from '@/lib/imageUploader';

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
     // Check if the file input was actually left empty by the user
    if (file.name === "" && file.size === 0 && !file.type) {
        console.log('[imageUploadActions] Empty file input detected, treating as no file for upload.');
        file = null; // Treat as if no file was selected, leading to removal logic
    }
  } else if (fileEntry === null) {
    // This means the key 'profileImage' was not appended or was explicitly set to null.
    // This path is for explicit photo removal or no file selected.
    console.log('[imageUploadActions] fileEntry is null, proceeding with photo removal/no file logic.');
  } else if (typeof fileEntry === 'string' && fileEntry === 'null') {
    // If 'profileImage' was appended as the string "null"
    console.log('[imageUploadActions] fileEntry is the string "null", proceeding with photo removal/no file logic.');
  } else if (fileEntry) {
    console.error('[imageUploadActions] Invalid data type for profileImage. Expected File or null, got:', typeof fileEntry, fileEntry);
    return { success: false, message: 'Tipo de arquivo de imagem inválido.' };
  }


  if (!file) {
    console.log('[imageUploadActions] No file provided, attempting to remove photo for playerId:', playerId);
    try {
      const removeResult = await adminUpdatePlayerFullAction(playerId, { foto: null });
      if (removeResult.success) {
        console.log('[imageUploadActions] Photo removed successfully for playerId:', playerId);
        return { success: true, message: 'Foto de perfil removida.', newPhotoUrl: null };
      } else {
        console.error('[imageUploadActions] Failed to remove photo for playerId:', playerId, 'Details:', removeResult.message);
        return { success: false, message: 'Falha ao remover foto do perfil.' };
      }
    } catch (error) {
      console.error('[imageUploadActions] Error during photo removal for playerId (adminUpdatePlayerFullAction failed):', playerId, error);
      return {
        success: false,
        message: 'Erro ao processar remoção da foto.'
      };
    }
  }

  console.log('[imageUploadActions] File received for upload:', file.name, file.size, file.type);

  if (file.size === 0 && file.name === "" && !file.type) {
      // This case should ideally be caught earlier and file set to null
      console.log('[imageUploadActions] Empty file object (no selection), treating as no file for upload.');
      // This should now go to the removal path handled by !file, but as a safeguard:
      // Re-evaluating the logic: if 'file' is not null here, it means it IS a File object.
      // An actual empty file (0 bytes but with a name/type) IS an error.
      // If it was an empty input, 'file' should have been nullified above.
      // So if we reach here and file.size is 0, it's an invalid empty file.
      console.error('[imageUploadActions] File is empty (0 bytes but is a File object) for playerId:', playerId);
      return { success: false, message: 'Arquivo da imagem está vazio.' };
  }


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
    console.error(`[imageUploadActions] Error converting file to buffer for playerId ${playerId}:`, bufferError);
    return { success: false, message: `Falha ao processar o arquivo.` };
  }

  try {
    console.log('[imageUploadActions] Uploading file to host for playerId:', playerId);
    const imageUrl = await uploadFileToHost(fileBuffer, file.name, file.type);
    console.log(`[imageUploadActions] Image URL from host for playerId ${playerId}: ${imageUrl}`);

    if (!imageUrl || typeof imageUrl !== 'string' || !(imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        console.error('[imageUploadActions] Invalid image URL received from host:', imageUrl);
        return { success: false, message: 'URL da imagem inválida do servidor de upload.' };
    }

    console.log(`[imageUploadActions] Updating player ${playerId} with foto: ${imageUrl}`);
    const updateResult = await adminUpdatePlayerFullAction(playerId, { foto: imageUrl });
    console.log(`[imageUploadActions] Firebase update result for playerId ${playerId}:`, updateResult);

    if (updateResult.success) {
      return {
        success: true,
        message: 'Foto de perfil atualizada com sucesso!',
        newPhotoUrl: imageUrl,
      };
    } else {
      console.error('[imageUploadActions] Firebase update failed for playerId:', playerId, 'Details:', updateResult.message);
      return {
        success: false,
        message: `Falha ao salvar foto no perfil.`,
      };
    }
  } catch (uploadOrDbError) {
    console.error(`[imageUploadActions] CRITICAL ERROR during profile photo upload (upload/DB stage) for playerId: ${playerId}:`, uploadOrDbError);
    return {
      success: false,
      message: `Falha crítica no upload da foto.`
    };
  }
}
