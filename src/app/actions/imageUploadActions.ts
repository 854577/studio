
'use server';

import { adminUpdatePlayerFullAction } from './playerActions';
import { uploadFileToHost } from '@/lib/imageUploader';

interface UploadResult {
  success: boolean;
  message: string;
  newPhotoUrl?: string | null;
}

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
  } else if (fileEntry === null) {
    // This is the "no file" case, handled below
  } else if (fileEntry) {
    // The entry exists but is not a File object
    console.error('[imageUploadActions] Invalid data type for profileImage. Expected File or null, got:', typeof fileEntry, fileEntry);
    return { success: false, message: 'Tipo de arquivo de imagem inválido. Por favor, selecione um arquivo de imagem válido.' };
  }


  if (!file) {
    console.log('[imageUploadActions] No file provided, attempting to remove photo for playerId:', playerId);
    try {
      const removeResult = await adminUpdatePlayerFullAction(playerId, { foto: null });
      if (removeResult.success) {
        console.log('[imageUploadActions] Photo removed successfully for playerId:', playerId);
        return { success: true, message: 'Foto de perfil removida.', newPhotoUrl: null };
      } else {
        console.error('[imageUploadActions] Failed to remove photo for playerId:', playerId, removeResult.message);
        return { success: false, message: `Falha ao remover foto: ${removeResult.message}` };
      }
    } catch (error) {
      console.error('[imageUploadActions] Error during photo removal for playerId (adminUpdatePlayerFullAction failed):', playerId, error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao tentar remover a foto.';
      return { 
        success: false, 
        message: `Erro ao remover foto: ${errorMessage.substring(0,100)}` 
      };
    }
  }

  console.log('[imageUploadActions] File received:', file.name, file.size, file.type);

  if (file.size === 0) {
    console.error('[imageUploadActions] File is empty for playerId:', playerId);
    return { success: false, message: 'Arquivo da imagem está vazio.' };
  }

  if (!file.type.startsWith('image/')) {
    console.error('[imageUploadActions] Invalid file type for playerId:', playerId, file.type);
    return { success: false, message: 'Arquivo inválido. Por favor, selecione uma imagem.' };
  }

  let fileBuffer: Buffer;
  try {
    console.log('[imageUploadActions] Converting file to buffer for playerId:', playerId);
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
    console.log(`[imageUploadActions] File buffer created for playerId ${playerId}, size: ${fileBuffer.length}`);
  } catch (bufferError) {
    console.error(`[imageUploadActions] Error converting file to buffer for playerId ${playerId}:`, bufferError);
    const errorMsg = bufferError instanceof Error ? bufferError.message : 'Erro ao processar arquivo de imagem.';
    return { success: false, message: `Falha ao processar arquivo: ${errorMsg.substring(0,100)}` };
  }
  
  try {
    console.log('[imageUploadActions] Uploading file to host for playerId:', playerId);
    const imageUrl = await uploadFileToHost(fileBuffer, file.name, file.type);
    console.log(`[imageUploadActions] Image URL from host for playerId ${playerId}: ${imageUrl}`);

    if (!imageUrl || typeof imageUrl !== 'string' || !(imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        console.error('[imageUploadActions] Invalid image URL received from host:', imageUrl);
        return { success: false, message: 'URL da imagem inválida retornada pelo servidor de upload.' };
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
      return {
        success: false,
        message: `Foto hospedada, mas falha ao salvar no perfil: ${updateResult.message}`,
      };
    }
  } catch (uploadOrDbError) { // Catches errors from uploadFileToHost or adminUpdatePlayerFullAction
    console.error(`[imageUploadActions] CRITICAL ERROR during profile photo upload (upload/DB stage) for playerId: ${playerId}:`, uploadOrDbError);
    
    let errorMessage = 'Ocorreu um erro desconhecido durante o processamento da foto.';
    if (uploadOrDbError instanceof Error) {
      errorMessage = uploadOrDbError.message;
    } else if (typeof uploadOrDbError === 'string') {
      errorMessage = uploadOrDbError;
    } else if (uploadOrDbError && typeof (uploadOrDbError as any).message === 'string') {
      errorMessage = (uploadOrDbError as any).message;
    }
    
    return { 
      success: false, 
      message: `Falha crítica no upload: ${errorMessage.substring(0, 100)}` 
    };
  }
}
