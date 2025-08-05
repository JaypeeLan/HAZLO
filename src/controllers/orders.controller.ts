import { NextFunction, Request, Response } from 'express';
import OrdersModel from '../models/orders';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { filter } = req.query;
  const userId = req.user?.id;
  console.log({ filter });
  try {
    const orders = await OrdersModel.find({ userId: userId, status: filter });

    sendResponse({
      res,
      status: 'success',
      message: 'Orders fetched successfully',
      statusCode: 201,
      data: orders,
    });
  } catch (error) {
    console.log({ error });

    next(
      error instanceof AppError ? error : new AppError('No orders found', 500)
    );
  }
};
