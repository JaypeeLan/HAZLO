import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import UserModel from '../models/user';
import { ResponseMessages } from '../utils/constants';
import {
  generateResetToken,
  generateJwtToken,
  formatUser,
} from '../utils/helpers';
import { sendResponse } from '../utils/sendResponse';
import OrderModel from '../models/order';
import bcrypt from 'bcrypt';
import PriceListModel from '../models/priceList';
import { GasPrice, LaundryItem } from '../types/index.types';

export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, password } = req.body;

    if (!email || !phone || !password) {
      throw new AppError(ResponseMessages.MISSING_FIELD, 400);
    }

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { phone }],
    }).select('+password');
    if (existingUser) {
      throw new AppError(ResponseMessages.ADMIN_EXISTS, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateResetToken();

    const createdAdmin = await UserModel.create({
      email,
      phone,
      password: hashedPassword,
      profileImage: null,
      username: null,
      name: null,
      address: null,
      isVerified: true,
      verificationToken,
    });

    const token = generateJwtToken(createdAdmin._id as string);

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: ResponseMessages.ADMIN_CREATE_SUCCESS,
      data: formatUser(createdAdmin, token),
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(
      error instanceof AppError
        ? error
        : new AppError(ResponseMessages.ADMIN_CREATE_ERROR, 500)
    );
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter: Record<string, any> = {};
    if (status && typeof status === 'string') {
      filter.orderStatus = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      OrderModel.find({ ...filter })
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      OrderModel.countDocuments(filter),
    ]);

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.ORDERS_FETCHED,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    next(new AppError(ResponseMessages.ORDERS_FETCH_FAILED, 500));
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      UserModel.find({ role: 'user' })
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      UserModel.countDocuments({ role: 'user' }),
    ]);

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: ResponseMessages.USERS_FETCHED,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(new AppError(error, 500));
  }
};

export const createPriceList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { service, gasPrices, laundryPrices } = req.body;

    if (!service) {
      throw new AppError('Service type is required', 400);
    }

    const existing = await PriceListModel.findOne({ service });
    if (existing) {
      throw new AppError(`${service} price list already exists`, 400);
    }

    const newPriceList = await PriceListModel.create({
      service,
      gasPrices: gasPrices || [],
      laundryPrices: laundryPrices || [],
    });

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: 'Price list created successfully',
      data: newPriceList,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to create price list', 500)
    );
  }
};

export const updatePriceList = async (
  req: Request<
    any,
    any,
    {
      service: 'gas' | 'laundry';
      gasPrices?: GasPrice[];
      laundryPrices?: LaundryItem[];
    }
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { service, gasPrices, laundryPrices } = req.body;

    if (!service) {
      throw new AppError('Service type is required', 400);
    }

    const priceList = await PriceListModel.findOne({ service });
    if (!priceList) {
      throw new AppError('Price list not found', 404);
    }

    if (service === 'gas' && Array.isArray(gasPrices)) {
      gasPrices.forEach((updateItem) => {
        const target = priceList.gasPrices.find(
          (g) => g.size === updateItem.size
        );
        if (target) {
          if (updateItem.orderPrice !== undefined)
            target.orderPrice = updateItem.orderPrice;
          if (updateItem.refillPrice !== undefined)
            target.refillPrice = updateItem.refillPrice;
        }
      });
    }

    if (service === 'laundry' && Array.isArray(laundryPrices)) {
      laundryPrices.forEach((updateItem) => {
        const target = priceList.laundryPrices.find(
          (l) => l.itemName === updateItem.itemName
        );
        if (target) {
          if (updateItem.price !== undefined) target.price = updateItem.price;
        }
      });
    }

    await priceList.save();

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Price list updated successfully',
      data: priceList,
    });
  } catch (error) {
    next(
      error instanceof AppError ? error : new AppError('Update failed', 500)
    );
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;

    const { orderStatus, paymentStatus } = req.body;

    const order = await OrderModel.findOneAndUpdate(
      { orderId },
      {
        orderStatus,
        paymentStatus,
      },
      { new: true }
    );

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: 'Order Updated',
      data: order,
    });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error, 500));
  }
};
