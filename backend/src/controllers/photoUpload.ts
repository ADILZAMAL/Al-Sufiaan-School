import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { getPhotoUrl } from '../middleware/upload';

export const uploadStaffPhoto = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return sendError(res, 'No photo file uploaded', 400);
        }

        // Get the photo URL from the uploaded file
        const photoUrl = getPhotoUrl(req.file);

        return sendSuccess(res, { photoUrl }, 'Photo uploaded successfully', 201);
    } catch (error: any) {
        console.error('Error uploading photo:', error);
        return sendError(res, 'Internal server error', 500);
    }
};
