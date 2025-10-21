import { NextFunction, Request, Response } from 'express';
import PriceListModel from '../models/priceList';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';
import { PriceItem } from '../types/index.types';
import { v4 as uuidv4 } from 'uuid';

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

    const responseData = priceList
      ? type
        ? {
            prices: priceList.prices.filter(
              (p) => p.type === type.toString().toLowerCase()
            ),
          }
        : priceList
      : { prices: [] };

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

export const managePriceList = async (
  req: Request<any, any, { prices?: PriceItem[] }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prices } = req.body;

    if (!prices || !Array.isArray(prices)) {
      throw new AppError('Prices array is required', 400);
    }

    // Validate price items and add id if not present
    const validTypes = ['gas_order', 'gas_refill', 'laundry'];
    const validatedPrices = prices.map((price) => ({
      ...price,
      id: price.id || uuidv4(),
    }));

    for (const price of validatedPrices) {
      if (
        !price.item ||
        !validTypes.includes(price.type) ||
        price.price == null
      ) {
        throw new AppError('Invalid price item format', 400);
      }
    }

    let priceList = await PriceListModel.findOne();

    if (!priceList) {
      // Create new price list if none exists
      priceList = await PriceListModel.create({
        prices: validatedPrices,
      });
      sendResponse({
        res,
        statusCode: 201,
        status: 'success',
        message: 'Price list created successfully',
        data: priceList,
      });
    }

    // Update existing prices or add new ones
    validatedPrices.forEach((updateItem) => {
      const targetIndex = priceList!.prices.findIndex(
        (p) => p.id === updateItem.id
      );
      if (targetIndex !== -1) {
        // Update existing item
        priceList!.prices[targetIndex] = { ...updateItem };
      } else {
        // Add new item
        priceList!.prices.push(updateItem);
      }
    });

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
      error instanceof AppError
        ? error
        : new AppError('Failed to manage price list', 500)
    );
  }
};

export const deletePriceItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Price item ID is required', 400);
    }

    const priceList = await PriceListModel.findOne();
    if (!priceList) {
      throw new AppError('Price list not found', 404);
    }

    const itemIndex = priceList.prices.findIndex((p) => p.id === id);
    if (itemIndex === -1) {
      throw new AppError('Price item not found', 404);
    }

    const deletedItem = priceList.prices[itemIndex];
    priceList.prices.splice(itemIndex, 1);
    await priceList.save();

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: `Price item ${deletedItem.item} (${deletedItem.type}) deleted successfully`,
      data: priceList,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to delete price item', 500)
    );
  }
};
