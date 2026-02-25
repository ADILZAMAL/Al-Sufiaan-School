import apiClient from './client';
import { PhotoUploadResponse } from '../types';

export const photoUploadApi = {
  uploadStudentPhoto: async (imageUri: string): Promise<string> => {
    const uriParts = imageUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

    const formData = new FormData();
    formData.append('studentPhoto', {
      uri: imageUri,
      name: `student_photo.${fileExtension}`,
      type: mimeType,
    } as any);

    const response = await apiClient.post<{ success: boolean; data: PhotoUploadResponse }>(
      '/photos/upload-student-photos',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const uploadedUrl = response.data.data.studentPhoto?.url;
    if (!uploadedUrl) {
      throw new Error('Photo upload succeeded but no URL was returned');
    }
    return uploadedUrl;
  },
};
