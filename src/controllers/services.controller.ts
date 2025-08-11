import { NextFunction, Request, Response } from 'express';
import PriceListModel from '../models/priceList';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';

export const getPriceList = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await PriceListModel.find();

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: 'Services fetched',
      data: services,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to fetch price list', 500)
    );
  }
};
