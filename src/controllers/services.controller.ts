import { NextFunction, Request, Response } from 'express';
import PriceListModel from '../models/priceList';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';

export const getPriceList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.query;

    const filter: Record<string, any> = {};
    if (type) {
      const validTypes = ['gas_order', 'gas_refill', 'laundry'];
      const typeString = type.toString().toLowerCase();
      if (!validTypes.includes(typeString)) {
        throw new AppError('Invalid type provided', 400);
      }
      filter['prices.type'] = typeString;
    }

    const priceList = await PriceListModel.findOne(filter);
    if (!priceList) {
      throw new AppError('Price list not found', 404);
    }

    const responseData = type
      ? {
          prices: priceList.prices.filter(
            (p) => p.type === type.toString().toLowerCase()
          ),
        }
      : priceList;

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Price list fetched successfully',
      data: responseData,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to fetch price list', 500)
    );
  }
};
