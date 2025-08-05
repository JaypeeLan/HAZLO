import { NextFunction, Request, Response } from 'express';
import cloudinary from '../utils/cloudinary';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';
import { ENV } from '../config/env';

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next(
        new AppError(
          `No file uploaded with key '${ENV.UPLOAD_FILE_KEY || 'image'}'`,
          400
        )
      );
    }

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'));
          } else {
            resolve(result);
          }
        })
        .end(req.file.buffer);
    });

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Image uploaded successfully',
      data: (result as any)?.secure_url,
    });
  } catch (error: any) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(`File size exceeds the limit of 5MB`, 400));
    }
    if (error.message.includes('Invalid file type')) {
      return next(new AppError(error.message, 400));
    }
    return next(
      error instanceof AppError
        ? error
        : new AppError(
            `Error uploading to Cloudinary: ${error.message || 'Internal server error'}`,
            500
          )
    );
  }
};
