
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

  const file = formData.get('profileImage') as File | null;

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
      console.error('[imageUploadActions] Error during photo removal for playerId:', playerId, error);
      return { success: false, message: 'Erro ao tentar remover a foto.' };
    }
  }

  console.log('[imageUploadActions] File received:', file.name, file.size, file.type);

  if (file.size === 0) {
    console.error('[imageUploadActions] File is empty.');
    return { success: false, message: 'Arquivo da imagem está vazio.' };
  }

  if (!file.type.startsWith('image/')) {
    console.error('[imageUploadActions] Invalid file type:', file.type);
    return { success: false, message: 'Arquivo inválido. Por favor, selecione uma imagem.' };
  }

  try {
    console.log('[imageUploadActions] Converting file to buffer...');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`[imageUploadActions] File buffer created, size: ${fileBuffer.length}`);

    console.log('[imageUploadActions] Uploading file to host...');
    const imageUrl = await uploadFileToHost(fileBuffer, file.name, file.type);
    console.log(`[imageUploadActions] Image URL from host: ${imageUrl}`);

    console.log(`[imageUploadActions] Updating player ${playerId} with foto: ${imageUrl}`);
    const updateResult = await adminUpdatePlayerFullAction(playerId, { foto: imageUrl });
    console.log(`[imageUploadActions] Firebase update result:`, updateResult);

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
  } catch (error: any) {
    console.error('[imageUploadActions] CRITICAL ERROR during profile photo upload:', error);
    let errorMessage = 'Ocorreu um erro desconhecido durante o processamento da foto.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.toString === 'function') {
      errorMessage = error.toString();
    }
    
    return { success: false, message: `Falha no upload: ${String(errorMessage).substring(0, 250)}` };
  }
}
