import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: any;
  stack?: string;
}

class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Mongoose Validation Errors
const handleValidationError = (
  err: mongoose.Error.ValidationError
): ErrorResponse => {
  const errors: { [key: string]: string } = {};

  Object.keys(err.errors).forEach((key) => {
    const error = err.errors[key];
    if (error instanceof mongoose.Error.ValidatorError) {
      errors[key] = error.message;
    } else if (error instanceof mongoose.Error.CastError) {
      errors[key] = `Invalid ${key} format`;
    }
  });

  return {
    success: false,
    message: 'Validation failed',
    errors,
  };
};

// Handle Mongoose Cast Errors (Invalid ObjectId, etc.)
const handleCastError = (err: mongoose.Error.CastError): ErrorResponse => {
  return {
    success: false,
    message: `Invalid ${err.path}: ${err.value}`,
  };
};

// Handle Mongoose Duplicate Key Errors
const handleDuplicateKeyError = (err: any): ErrorResponse => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  return {
    success: false,
    message: `${field} '${value}' already exists`,
  };
};

// Handle JWT Errors
const handleJWTError = (): ErrorResponse => ({
  success: false,
  message: 'Invalid token. Please log in again.',
});

const handleJWTExpiredError = (): ErrorResponse => ({
  success: false,
  message: 'Your token has expired. Please log in again.',
});

// Send error response in development
const sendErrorDev = (err: any, res: Response): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send error response in production
const sendErrorProd = (err: any, res: Response): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    console.error('ERROR ', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Global Error Handler Middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle AppError explicitly (for both development and production)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle specific error types (Mongoose, JWT, etc.)
  if (err instanceof mongoose.Error.ValidationError) {
    const errorResponse = handleValidationError(err);
    res.status(400).json(errorResponse);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    const errorResponse = handleCastError(err);
    res.status(400).json(errorResponse);
    return;
  }

  if (err.code === 11000) {
    const errorResponse = handleDuplicateKeyError(err);
    res.status(400).json(errorResponse);
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    const errorResponse = handleJWTError();
    res.status(401).json(errorResponse);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const errorResponse = handleJWTExpiredError();
    res.status(401).json(errorResponse);
    return;
  }

  // Environment-specific error handling for other errors
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
    return;
  }

  const error = { ...err };
  error.message = err.message;
  sendErrorProd(error, res);
};

// Async Error Handler Wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// 404 Handler for undefined routes
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
};

export { AppError };
