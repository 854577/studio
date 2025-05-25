
'use server';

import { adminUpdatePlayerFullAction } from './playerActions';
import { uploadFileToHost } from '@/lib/imageUploader'; // Placeholder uploader

interface UploadResult {
  success: boolean;
  message: string;
  newPhotoUrl?: string | null;
}

export async function handleProfilePhotoUploadAction(
  formData: FormData,
  playerId: string
): Promise<UploadResult> {
  if (!playerId) {
    return { success: false, message: 'ID do jogador não fornecido.' };
  }

  const file = formData.get('profileImage') as File | null;

  if (!file) {
    // If no file is provided, it means the user wants to remove the photo
    // Or if your UI prevents this, you can treat it as an error.
    // For now, let's assume removing the photo if no file is sent.
    // However, the UI logic in page.tsx is now more explicit about selection.
    // This path might not be hit if button is disabled when !selectedFile
    console.warn('Tentativa de upload sem arquivo. Verifique a lógica da UI.');
    // Let's try to remove the photo if no file is selected
    const removeResult = await adminUpdatePlayerFullAction(playerId, { foto: null });
     if (removeResult.success) {
      return { success: true, message: 'Foto de perfil removida.', newPhotoUrl: null };
    } else {
      return { success: false, message: `Falha ao remover foto: ${removeResult.message}` };
    }
  }

  if (file.size === 0) {
    return { success: false, message: 'Arquivo da imagem está vazio.' };
  }

  // Validate file type (optional, but good practice)
  if (!file.type.startsWith('image/')) {
    return { success: false, message: 'Arquivo inválido. Por favor, selecione uma imagem.' };
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Call the (placeholder) upload function
    // This is where you'd integrate your actual image hosting API call
    const imageUrl = await uploadFileToHost(fileBuffer, file.name, file.type);

    if (!imageUrl) {
      throw new Error('Falha ao obter URL da imagem do serviço de hospedagem.');
    }

    // Save the new image URL to Firebase
    const updateResult = await adminUpdatePlayerFullAction(playerId, { foto: imageUrl });

    if (updateResult.success) {
      return {
        success: true,
        message: 'Foto de perfil atualizada com sucesso!',
        newPhotoUrl: imageUrl,
      };
    } else {
      // Attempt to "rollback" or notify about partial failure if needed.
      // For now, just return the Firebase update error.
      return {
        success: false,
        message: `Foto hospedada, mas falha ao salvar no perfil: ${updateResult.message}`,
      };
    }
  } catch (error) {
    console.error('Erro durante o upload da foto de perfil:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao processar a foto.';
    return { success: false, message: errorMessage };
  }
}

    