import cloudinary from '../config/cloudinary';

/**
 * Delete a photo from Cloudinary using its public ID
 * @param publicId - The public ID of the image to delete
 * @returns Promise<boolean> - True if deletion was successful
 */
export const deletePhotoFromCloudinary = async (publicId: string): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting photo from Cloudinary:', error);
        return false;
    }
};

/**
 * Get optimized image URL with transformations
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 * @returns string - Optimized image URL
 */
export const getOptimizedImageUrl = (
    publicId: string, 
    options: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: string;
        format?: string;
    } = {}
): string => {
    const {
        width = 400,
        height = 400,
        crop = 'fill',
        quality = 'auto',
        format = 'auto'
    } = options;

    return cloudinary.url(publicId, {
        width,
        height,
        crop,
        quality,
        format,
        secure: true
    });
};
