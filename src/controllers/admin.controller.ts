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
import { PriceItem } from '../types/index.types';
import TransactionModel from '../models/transaction';

export const getAdminDashboardAnalytics = async (
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userStats = await UserModel.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: 'count' }],
          verifiedUsers: [
            { $match: { isVerified: true } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const totalUsers = userStats[0].totalUsers[0]?.count || 0;
    const verifiedUsers = userStats[0].verifiedUsers[0]?.count || 0;

    // Aggregate order analytics
    const orderStats = await OrderModel.aggregate([
      {
        $facet: {
          totalOrders: [{ $count: 'count' }],
          completedOrders: [
            { $match: { orderStatus: 'completed' } },
            { $count: 'count' },
          ],
          pendingOrders: [
            { $match: { orderStatus: 'pending' } },
            { $count: 'count' },
          ],
          totalRevenue: [
            { $match: { orderStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ],
        },
      },
    ]);

    const totalOrders = orderStats[0].totalOrders[0]?.count || 0;
    const completedOrders = orderStats[0].completedOrders[0]?.count || 0;
    const pendingOrders = orderStats[0].pendingOrders[0]?.count || 0;
    const totalRevenue = orderStats[0].totalRevenue[0]?.total || 0;

    // Aggregate transaction status breakdown
    const transactionStats = await TransactionModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const transactionStatusBreakdown = transactionStats.reduce(
      (acc, { _id, count }) => ({ ...acc, [_id]: count }),
      { pending: 0, success: 0, failed: 0, refund_pending: 0, refunded: 0 }
    );

    // Prepare response data
    const analytics = {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        otherStatuses: totalOrders - completedOrders - pendingOrders,
      },
      revenue: {
        totalCompleted: totalRevenue,
      },
      transactions: transactionStatusBreakdown,
    };

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Admin dashboard analytics retrieved successfully',
      data: analytics,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to retrieve analytics', 500)
    );
  }
};

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
      role: 'admin',
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

export const createPriceList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prices } = req.body;

    if (!prices || !Array.isArray(prices)) {
      throw new AppError('Prices array is required', 400);
    }

    // Validate that all price items have required fields
    const validTypes = ['gas_order', 'gas_refill', 'laundry'];
    for (const price of prices) {
      if (
        !price.item ||
        !validTypes.includes(price.type) ||
        price.price == null
      ) {
        throw new AppError('Invalid price item format', 400);
      }
    }

    const newPriceList = await PriceListModel.create({
      prices,
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
  req: Request<any, any, { prices?: PriceItem[] }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prices } = req.body;

    if (!prices || !Array.isArray(prices)) {
      throw new AppError('Prices array is required', 400);
    }

    const priceList = await PriceListModel.findOne();
    if (!priceList) {
      throw new AppError('Price list not found', 404);
    }

    // Update existing prices or add new ones
    prices.forEach((updateItem) => {
      const target = priceList.prices.find(
        (p) => p.item === updateItem.item && p.type === updateItem.type
      );
      if (target) {
        if (updateItem.price !== undefined) {
          target.price = updateItem.price;
        }
      } else {
        priceList.prices.push(updateItem);
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
      error instanceof AppError ? error : new AppError('Update failed', 500)
    );
  }
};

export const deletePriceItem = async (
  req: Request<
    any,
    any,
    { item: string; type: 'gas_order' | 'gas_refill' | 'laundry' }
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { item, type } = req.body;

    if (!item || !type) {
      throw new AppError('Item and type are required', 400);
    }

    const validTypes = ['gas_order', 'gas_refill', 'laundry'];
    if (!validTypes.includes(type)) {
      throw new AppError('Invalid type provided', 400);
    }

    const priceList = await PriceListModel.findOne();
    if (!priceList) {
      throw new AppError('Price list not found', 404);
    }

    const itemIndex = priceList.prices.findIndex(
      (p) => p.item === item && p.type === type
    );
    if (itemIndex === -1) {
      throw new AppError('Price item not found', 404);
    }

    priceList.prices.splice(itemIndex, 1);
    await priceList.save();

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: `Price item ${item} (${type}) deleted successfully`,
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
