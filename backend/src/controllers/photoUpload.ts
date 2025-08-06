import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import cloudinary, { staffPhotoUploadOptions } from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

export const uploadStaffPhoto = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return sendError(res, 'No photo file uploaded', 400);
        }

        // Upload to Cloudinary using upload_stream
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    ...staffPhotoUploadOptions,
                    // Add date-based folder structure
                    folder: `${staffPhotoUploadOptions.folder}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Upload failed - no result returned'));
                    }
                }
            );

            // Write the buffer to the upload stream
            uploadStream.end(req.file!.buffer);
        });

        return sendSuccess(res, { 
            photoUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: uploadResult.bytes
        }, 'Photo uploaded successfully', 201);
    } catch (error: any) {
        console.error('Error uploading photo to Cloudinary:', error);
        return sendError(res, 'Failed to upload photo', 500);
    }
};
