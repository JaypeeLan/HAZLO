import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { sendResponse } from '../utils/sendResponse';
import crypto from 'crypto';
import OrderModel from '../models/order';
import { validateOrderFields } from '../middlewares/validator';
import { ResponseMessages } from '../utils/constants';
import NotificationModel from '../models/notification';
import { messaging } from '../services/firebase/admin';
import UserModel from '../models/user';

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerName = req.user?.name;
    const customerId = req.user?.id;
    const orderDetails = req.body;

    if (!customerName || !customerId) {
      throw new AppError(
        'Customer info missing. Please update your profile',
        400
      );
    }

    validateOrderFields(req.body.serviceType, req.body);

    // Calculate total based on IOrder fields
    let total = 0;
    if (orderDetails.serviceType === 'laundry' && orderDetails.items) {
      total = orderDetails.items.reduce((sum: number, item: any) => {
        return sum + (item.itemPrice || 0) * (item.itemQuantity || 0);
      }, 0);
    } else if (
      orderDetails.serviceType === 'refillCylinder' &&
      orderDetails.refillSize
    ) {
      total = orderDetails.total || 0;
    } else if (
      orderDetails.serviceType === 'buyCylinder' &&
      orderDetails.cylinderSize
    ) {
      total = orderDetails.total || 0;
    }

    if (total === 0) {
      throw new AppError('Invalid order details: total cannot be zero', 400);
    }

    // Create the order
    const order = await OrderModel.create({
      customerName,
      customerId,
      orderId: crypto.randomBytes(8).toString('hex'),
      serviceType: orderDetails.serviceType,
      paymentStatus: 'pending',
      total,
      ...orderDetails,
    });

    try {
      const user = await UserModel.findById(customerId).select('deviceToken');
      const admin = await UserModel.findOne({ role: 'admin' }).select(
        'deviceToken'
      );

      // Save notification for customer
      await NotificationModel.create({
        user: customerId,
        title: 'Order Created',
        message: `Your ${order.serviceType} order has been placed successfully.`,
        type: 'order',
        read: false,
        metadata: { orderId: order._id },
      });

      // Save notification for admin
      await NotificationModel.create({
        user: admin?._id,
        title: 'New Order Received',
        message: `A new ${order.serviceType} order has been placed by ${customerName}.`,
        type: 'order',
        read: false,
        metadata: { orderId: order._id },
      });

      // Send push to customer if token exists
      if (user?.deviceToken) {
        const message = {
          notification: {
            title: 'Order Created Successfully',
            body: `Your ${order.serviceType} order has been placed successfully.`,
          },
          token: user.deviceToken,
        };
        await messaging.send(message);
      }

      // Send push to admin if token exists
      if (admin?.deviceToken) {
        const adminMessage = {
          notification: {
            title: 'New Order Received',
            body: `A new ${order.serviceType} order has been placed by ${customerName}.`,
          },
          token: admin.deviceToken,
        };
        await messaging.send(adminMessage);
      }
    } catch (notifyError) {
      console.error('Failed to process notification:', notifyError);
    }

    sendResponse({
      res,
      statusCode: 201,
      status: 'success',
      message: ResponseMessages.ORDER_CREATED,
      data: order,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(error.message || 'Failed to create order', 400)
    );
  }
};

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderStatus, paymentStatus, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const filter: Record<string, any> = { customerId: userId };

    if (orderStatus && typeof orderStatus === 'string') {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus && typeof paymentStatus === 'string') {
      filter.paymentStatus = paymentStatus;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
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
