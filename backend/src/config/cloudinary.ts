import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload options for staff photos
export const staffPhotoUploadOptions = {
    folder: 'al-sufiaan-school/staff-photos',
    use_filename: false,
    unique_filename: true,
    overwrite: false,
    resource_type: 'image' as const,
    quality: 'auto'
};

export default cloudinary;
