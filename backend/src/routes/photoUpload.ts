import { Router } from 'express';
import { uploadStaffPhoto, uploadStudentPhotos } from '../controllers/photoUpload';
import { uploadSinglePhoto, uploadMultipleStudentPhotos } from '../middleware/upload';
import verifyToken from '../middleware/auth';

const router = Router();

// Upload staff photo
router.post('/upload-staff-photo', verifyToken, uploadSinglePhoto, uploadStaffPhoto);

// Upload student photos (student, father, mother, guardian)
router.post('/upload-student-photos', verifyToken, uploadMultipleStudentPhotos, uploadStudentPhotos);

export default router;
