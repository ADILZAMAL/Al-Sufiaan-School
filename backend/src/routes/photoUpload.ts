import { Router } from 'express';
import { uploadStaffPhoto } from '../controllers/photoUpload';
import { uploadSinglePhoto } from '../middleware/upload';
import verifyToken from '../middleware/auth';

const router = Router();

// Upload staff photo
router.post('/upload-staff-photo', verifyToken, uploadSinglePhoto, uploadStaffPhoto);

export default router;
