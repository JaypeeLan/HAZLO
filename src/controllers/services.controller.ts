import { NextFunction, Request, Response } from 'express';
import PriceListModel from '../models/priceList';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';

export const getPriceList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { service } = req.query;

    if (
      service &&
      !['gas', 'laundry'].includes(service.toString().toLowerCase())
    ) {
      throw new AppError('Invalid service type', 400);
    }

    const filter: Record<string, any> = {};
    if (service) {
      filter.service = service.toString().toLowerCase();
    }

    const services = await PriceListModel.find(filter);

    sendResponse({
      res,
      statusCode: 200,
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
