import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { sendResponse } from '../utils/sendResponse';
import crypto from 'crypto';
import OrderModel from '../models/orders';
import { validateOrderFields } from '../middlewares/validator';
import { ResponseMessages } from '../utils/constants';

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerName = req.user?.name;
    const customerId = req.user?.id;
    if (!customerName || !customerId) {
      throw new AppError('Customer info missing', 400);
    }

    validateOrderFields(req.body.serviceType, req.body);

    const orderId = crypto.randomBytes(8).toString('hex');

    const order = await OrderModel.create({
      customerName,
      customerId,
      orderId,
      serviceType: req.body.serviceType,
      details: req.body,
    });

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: ResponseMessages.ORDER_CREATED,
      data: order,
    });
  } catch (err: any) {
    next(new AppError(err.message || 'Failed to create order', 400));
  }
};

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const filter: Record<string, any> = {};
    if (status && typeof status === 'string') {
      filter.orderStatus = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      OrderModel.find({ customerId: userId, ...filter })
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
