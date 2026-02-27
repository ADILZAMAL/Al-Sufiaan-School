import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import cloudinary, { staffPhotoUploadOptions } from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';
import logger from '../utils/logger';

// Helper function to upload a single image to Cloudinary
const uploadImageToCloudinary = async (
    file: Express.Multer.File | Buffer, 
    folderPath: string,
    fileName?: string
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderPath,
                public_id: fileName,
                transformation: [
                    { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
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

        // Handle both buffer and file upload
        if (Buffer.isBuffer(file)) {
            uploadStream.end(file);
        } else {
            uploadStream.end(file.buffer);
        }
    });
};

export const uploadStaffPhoto = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return sendError(res, 'No photo file uploaded', 400);
        }

        // Upload to Cloudinary using upload_stream
        const uploadResult = await uploadImageToCloudinary(
            req.file!,
            `${staffPhotoUploadOptions.folder}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`
        );

        return sendSuccess(res, { 
            photoUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: uploadResult.bytes
        }, 'Photo uploaded successfully', 201);
    } catch (error: any) {
        logger.error('Error uploading photo to Cloudinary', { error });
        return sendError(res, 'Failed to upload photo', 500);
    }
};

export const uploadStudentPhotos = async (req: Request, res: Response) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files || Object.keys(files).length === 0) {
            return sendError(res, 'No photo files uploaded', 400);
        }

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const baseFolder = `student-photos/${year}/${month}`;

        const uploadResults: { [key: string]: any } = {};
        const uploadPromises: Promise<void>[] = [];

        // Process each photo type
        const photoTypes = ['studentPhoto', 'fatherPhoto', 'motherPhoto', 'guardianPhoto'];

        for (const photoType of photoTypes) {
            if (files[photoType] && files[photoType].length > 0) {
                const file = files[photoType][0];
                
                uploadPromises.push(
                    uploadImageToCloudinary(
                        file,
                        `${baseFolder}/${photoType}`
                    ).then(result => {
                        uploadResults[photoType] = {
                            url: result.secure_url,
                            publicId: result.public_id,
                            format: result.format,
                            width: result.width,
                            height: result.height,
                            bytes: result.bytes
                        };
                    }).catch(error => {
                        logger.error(`Error uploading ${photoType}:`, { error });
                        uploadResults[photoType] = { error: error.message };
                    })
                );
            }
        }

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);

        // Check if any uploads failed
        const failedUploads = Object.entries(uploadResults).filter(([_, result]: [string, any]) => result.error);
        
        if (failedUploads.length > 0) {
            return sendError(
                res, 
                `Some photos failed to upload: ${failedUploads.map(([type]) => type).join(', ')}`,
                207, // Multi-status
                { uploadResults }
            );
        }

        return sendSuccess(
            res, 
            uploadResults, 
            'Student photos uploaded successfully', 
            201
        );
    } catch (error: any) {
        logger.error('Error uploading student photos to Cloudinary', { error });
        return sendError(res, 'Failed to upload student photos', 500);
    }
};
