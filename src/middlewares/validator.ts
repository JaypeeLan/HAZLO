import { Request, Response, NextFunction } from 'express';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{11}$/; // e.g., 11-digit NG number
const nameRegex = /^[a-zA-Z\s]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

const globalValidator = (obj: any): string[] => {
  const errors: string[] = [];

  const check = (item: any, prefix = '') => {
    for (const key in item) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = item[key];

      if (typeof value === 'string') {
        if (value.trim() === '') {
          errors.push(`${fullKey} should not be empty`);
        }

        // Specific field checks
        if (key.toLowerCase().includes('email') && !emailRegex.test(value)) {
          errors.push(`${fullKey} is not a valid email`);
        }

        if (key.toLowerCase().includes('phone') && !phoneRegex.test(value)) {
          errors.push(`${fullKey} must be a valid 11-digit phone number`);
        }

        if (key.toLowerCase().includes('name') && !nameRegex.test(value)) {
          errors.push(`${fullKey} must contain only letters and spaces`);
        }

        if (
          key.toLowerCase().includes('password') &&
          !passwordRegex.test(value)
        ) {
          errors.push(
            `${fullKey} must be at least 6 characters, contain letters and numbers`
          );
        }
      }

      if (value === null || value === undefined) {
        errors.push(`${fullKey} is required`);
      }

      if (typeof value === 'object' && value !== null) {
        check(value, fullKey);
      }
    }
  };

  check(obj);
  return errors;
};

// Validation Middleware
export const validateRequests = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const errors: string[] = [];

  if (req.body && typeof req.body === 'object') {
    errors.push(...globalValidator(req.body));
  }

  if (req.query && typeof req.query === 'object') {
    errors.push(...globalValidator(req.query));
  }

  if (errors.length > 0) {
    const errorMessage = errors.join('; ');
    return res.status(400).json({
      status: false,
      message: 'Validation failed',
      error: errorMessage,
    });
  }

  next();
};
