import multer from 'multer';
import { ENV } from '../config/env';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
      (req as any).fileValidationError =
        'Invalid file type: Only image files are allowed';
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
}).single(ENV.UPLOAD_FILE_KEY || 'image');

export default upload;
