import multer from 'multer';
import { Request } from 'express';

// File filter to allow only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
};

// Configure multer for memory storage (files will be uploaded to Cloudinary)
export const uploadPhoto = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

// Middleware to handle single photo upload
export const uploadSinglePhoto = uploadPhoto.single('photo');

// Middleware to handle multiple photo uploads (max 4 photos)
export const uploadMultipleStudentPhotos = uploadPhoto.fields([
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'fatherPhoto', maxCount: 1 },
    { name: 'motherPhoto', maxCount: 1 },
    { name: 'guardianPhoto', maxCount: 1 }
]);
