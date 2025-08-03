import { ENV } from '../config/env';
import { ResponseMessages } from '../utils/constants';
import { AppError } from './errorHandler';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Middleware to authenticate JWT token
export const authenticateToken = (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError(ResponseMessages.NO_TOKEN, 401));
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return next(new AppError(ResponseMessages.INVALID_TOKEN, 401));
  }
};

// Middleware for role-based authorization
export const authorize = (requiredRoles: string[]) => {
  return (req: Request, _: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError(ResponseMessages.NO_USER, 401));
    }

    // Check if user's role is included in the required roles
    if (!requiredRoles.includes(user.role)) {
      return next(new AppError(ResponseMessages.UNAUTHORIZED, 403));
    }

    next();
  };
};
