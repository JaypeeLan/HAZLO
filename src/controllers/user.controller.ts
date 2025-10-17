import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { ResponseMessages } from '../utils/constants';
import { sendResponse } from '../utils/sendResponse';
import UserModel from '../models/user';

import cloudinary from 'cloudinary';
import { messaging } from '../services/firebase/admin';
import NotificationModel from '../models/notification';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ResponseMessages.UNAUTHORIZED, 401);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.PROFILE_FETCHED,
      data: user,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.PROFILE_ERROR, 500)
    );
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, address, phone, email, username, deviceToken, countryCode } =
      req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ResponseMessages.UNAUTHORIZED, 401);
    }

    const updateData = {
      ...(name && { name }),
      ...(address && { address }),
      ...(username && { username }),
      ...(deviceToken && { deviceToken }),
      ...(countryCode && { countryCode }),
      ...(phone && { phone }),
      ...(email && { email }),
    };

    if (Object.keys(updateData).length === 0) {
      throw new AppError(ResponseMessages.INVALID_PROFILE_DATA, 400);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    try {
      // Always save notification
      await NotificationModel.create({
        user: userId,
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
        type: 'profile',
        read: false,
        metadata: { updatedFields: Object.keys(updateData) },
      });

      // Only send push if deviceToken is present
      if (updatedUser.deviceToken) {
        const message = {
          notification: {
            title: 'Profile Updated',
            body: 'Your profile has been updated successfully.',
          },
          token: updatedUser.deviceToken,
        };
        await messaging.send(message);
      }
    } catch (notifyError) {
      console.error(
        'Failed to process profile update notification:',
        notifyError
      );
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.PROFILE_UPDATED,
      data: updatedUser,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.PROFILE_ERROR, 500)
    );
  }
};
export const updateProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ResponseMessages.UNAUTHORIZED, 401);
    }

    // Check if the request is multipart/form-data
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      throw new AppError('Request must be multipart/form-data', 400);
    }

    // Extract the boundary from the Content-Type header
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      throw new AppError('Invalid multipart/form-data: Missing boundary', 400);
    }
    const boundary = `--${boundaryMatch[1]}`;

    // Collect raw request body
    const chunks: Buffer[] = [];
    let totalSize = 0;
    const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // Default to 5MB

    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > maxFileSize) {
          reject(
            new AppError(
              `Request size exceeds the limit of ${maxFileSize / (1024 * 1024)}MB`,
              400
            )
          );
          return;
        }
        chunks.push(chunk);
      });

      req.on('end', () => resolve());
      req.on('error', (error) =>
        reject(new AppError(`Error reading request: ${error.message}`, 400))
      );
    });

    const rawBody = Buffer.concat(chunks);

    // Parse the multipart/form-data manually
    // const boundaryBuffer = Buffer.from(boundary);
    const parts = rawBody.toString('binary').split(boundary);
    let fileBuffer: Buffer | null = null;
    let fileMimeType: string | null = null;

    for (const part of parts) {
      // Skip empty parts or the final boundary
      if (part.length < 10 || part.startsWith('--')) continue;

      // Extract headers and content
      const [headerSection, ...contentSections] = part.split('\r\n\r\n');
      const content = contentSections.join('\r\n\r\n').replace(/\r\n$/, '');

      // Parse headers
      const headers = headerSection.split('\r\n').reduce(
        (acc, line) => {
          const [key, value] = line.split(': ').map((s) => s.trim());
          if (key && value) acc[key.toLowerCase()] = value;
          return acc;
        },
        {} as Record<string, string>
      );

      // Check if this part is the profileImage file
      const disposition = headers['content-disposition'];
      if (!disposition || !disposition.includes('name="profileImage"'))
        continue;

      // Extract MIME type
      fileMimeType = headers['content-type'];
      if (!fileMimeType || !fileMimeType.match(/image\/(png|jpeg|jpg|gif)/)) {
        throw new AppError(
          'Invalid file type: Only PNG, JPEG, or GIF images are allowed',
          400
        );
      }

      // Convert content to Buffer (handle binary data)
      fileBuffer = Buffer.from(content, 'binary');

      // Validate file size
      if (fileBuffer.length > maxFileSize) {
        throw new AppError(
          `File size exceeds the limit of ${maxFileSize / (1024 * 1024)}MB`,
          400
        );
      }

      break; // Found the file, no need to process further parts
    }

    if (!fileBuffer || !fileMimeType) {
      throw new AppError(
        'No valid image file uploaded with key "profileImage"',
        400
      );
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader
        .upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'));
          } else {
            resolve(result);
          }
        })
        .end(fileBuffer);
    });

    // Update user's profileImage field with the Cloudinary URL
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { profileImage: (result as any).secure_url },
      { new: true }
    );

    if (!updatedUser) {
      throw new AppError(ResponseMessages.USER_NOT_FOUND, 404);
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Profile image updated successfully',
      data: updatedUser,
    });
  } catch (error: any) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            `Error updating profile image: ${error.message || 'Internal server error'}`,
            500
          )
    );
  }
};
