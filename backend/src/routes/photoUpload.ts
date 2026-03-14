import { Router } from 'express';
import { uploadStaffPhoto, uploadStudentPhotos, uploadSchoolLogo } from '../controllers/photoUpload';
import { uploadSinglePhoto, uploadMultipleStudentPhotos } from '../middleware/upload';
import verifyToken, { verifyOnboardToken } from '../middleware/auth';

const router = Router();

// Upload staff photo
router.post('/upload-staff-photo', verifyToken, uploadSinglePhoto, uploadStaffPhoto);

// Upload student photos (student, father, mother, guardian)
router.post('/upload-student-photos', verifyToken, uploadMultipleStudentPhotos, uploadStudentPhotos);

// Upload school logo (during onboarding)
router.post('/upload-school-logo', verifyOnboardToken, uploadSinglePhoto, uploadSchoolLogo);

// Update school logo (for existing schools)
router.put('/upload-school-logo', verifyToken, uploadSinglePhoto, uploadSchoolLogo);

export default router;
