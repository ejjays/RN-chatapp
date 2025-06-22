import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const imageRef = ref(storage, path);
    await uploadBytes(imageRef, blob);
    
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadChatImage = async (uri: string, chatId: string, messageId: string): Promise<string> => {
  const path = `chats/${chatId}/images/${messageId}_${Date.now()}.jpg`;
  return uploadImage(uri, path);
};