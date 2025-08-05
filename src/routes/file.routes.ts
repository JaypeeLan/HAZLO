import { Router } from 'express';
import upload from '../utils/multer';
import { uploadImage } from '../controllers/fileupload.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/upload-image', authenticateToken, upload, uploadImage);

export default router;
