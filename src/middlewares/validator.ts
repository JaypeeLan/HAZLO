/* eslint-disable no-useless-escape */
import { Request, Response, NextFunction } from 'express';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-Z\s]+$/;

const passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

const globalValidator = (obj: any): string[] => {
  const errors: string[] = [];

  const check = (item: any, prefix = '') => {
    for (const key in item) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = item[key];

      if (value === null || value === undefined) {
        errors.push(`${fullKey} is required`);
        continue;
      }

      if (typeof value === 'string') {
        if (value.trim() === '') {
          errors.push(`${fullKey} should not be empty`);
          continue;
        }

        if (key.toLowerCase().includes('email') && !emailRegex.test(value)) {
          errors.push(`${fullKey} is not a valid email`);
        }

        if (key.toLowerCase().includes('name') && !nameRegex.test(value)) {
          errors.push(`${fullKey} must contain only letters and spaces`);
        }

        if (
          key.toLowerCase().includes('password') &&
          !passwordRegex.test(value)
        ) {
          errors.push(
            `${fullKey} must be at least 6 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character`
          );
        }
      }

      if (typeof value === 'object' && value !== null) {
        check(value, fullKey);
      }
    }
  };

  check(obj);
  return errors;
};

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

export const validateOrderFields = (serviceType: string, body: any) => {
  if (!serviceType) throw new Error('Service type is required');

  switch (serviceType) {
    case 'refillCylinder':
      if (!body.refillSize) throw new Error('Refill size is required');
      if (!body.pickupAddress) throw new Error('Pickup address is required');
      if (!body.deliveryAddress)
        throw new Error('Delivery address is required');
      if (!body.phoneNumber) throw new Error('Phone number is required');
      if (!body.deliveryTime) throw new Error('Delivery time is required');
      if (body.deliveryTime === 'schedule' && (!body.date || !body.time)) {
        throw new Error('Date and time are required for scheduled delivery');
      }
      if (!body.total) throw new Error('Total is required');
      break;

    case 'buyCylinder':
      if (!body.cylinderSize) throw new Error('Cylinder size is required');
      if (!body.deliveryAddress)
        throw new Error('Delivery address is required');
      if (!body.deliveryTime) throw new Error('Delivery time is required');
      if (body.deliveryTime === 'schedule' && (!body.date || !body.time)) {
        throw new Error('Date and time are required for scheduled delivery');
      }
      if (!body.total) throw new Error('Total is required');
      break;

    case 'laundry':
      if (!body.serviceTypeLaundry)
        throw new Error('Laundry service type is required');
      if (
        !body.items ||
        !Array.isArray(body.items) ||
        body.items.length === 0
      ) {
        throw new Error('At least one laundry item is required');
      }
      if (!body.pickupAddress) throw new Error('Pickup address is required');
      if (!body.deliveryAddress)
        throw new Error('Delivery address is required');
      if (!body.pickupPreference)
        throw new Error('Pickup preference is required');
      if (body.pickupPreference === 'schedule' && (!body.date || !body.time)) {
        throw new Error('Date and time are required for scheduled pickup');
      }
      if (!body.total) throw new Error('Total is required');
      break;

    default:
      throw new Error('Invalid service type');
  }
};
