import axios from 'axios';
import { ENV } from '../../config/env';
import OrderModel from '../../models/order';
import TransactionModel from '../../models/transaction';
import { AppError } from '../../middlewares/errorHandler';

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = ENV.PAYSTACK_KEY;

export const initializePayment = async (orderId: string, email: string) => {
  if (!orderId || typeof orderId !== 'string') {
    throw new AppError('Invalid or missing order ID', 400);
  }
  if (!email) {
    throw new AppError('Email is required', 400);
  }
  const order = await OrderModel.findOne({ orderId });
  if (!order || order.paymentStatus !== 'pending') {
    throw new AppError('Order not found or not eligible for payment', 400);
  }

  const amountInKobo = order.total * 100;
  try {
    const response = await axios.post(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      {
        email,
        amount: amountInKobo,
        metadata: { orderId: order._id.toString() },
        callback_url: `https://hazlo-l3io.onrender.com/api/v1/payments/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const transaction = new TransactionModel({
      orderId: order._id,
      transactionReference: response.data.data.reference,
      amount: amountInKobo,
      status: 'pending',
      paystackData: response.data,
    });
    await transaction.save();

    order.transactionId = transaction._id as any;
    await order.save();

    return response.data.data;
  } catch (error) {
    throw new AppError(
      `Failed to initialize payment: ${error.response?.data?.message || error.message}`,
      500
    );
  }
};

export const verifyPayment = async (reference: string) => {
  if (!reference) {
    throw new AppError('Payment reference is required', 400);
  }
  try {
    const response = await axios.get(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.data.status !== 'success') {
      throw new AppError('Payment verification failed', 400);
    }

    const transaction = await TransactionModel.findOne({
      transactionReference: reference,
    });
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    transaction.status = 'success';
    transaction.paystackData = response.data;
    await transaction.save();

    const order = await OrderModel.findById(transaction.orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    order.paymentStatus = 'paid';
    await order.save();

    return response.data;
  } catch (error) {
    throw new AppError(
      `Failed to verify payment: ${error.response?.data?.message || error.message}`,
      500
    );
  }
};

export const createRefund = async (orderId: string, reason: string) => {
  // if (!mongoose.isValidObjectId(orderId)) {
  //   throw new AppError('Invalid order ID', 400);
  // }
  if (reason && typeof reason !== 'string') {
    throw new AppError('Invalid reason format', 400);
  }
  const order = await OrderModel.findById(orderId);
  if (!order || order.paymentStatus !== 'paid') {
    throw new AppError('Order not found or not eligible for refund', 400);
  }

  const transaction = await TransactionModel.findOne({ orderId });
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  try {
    const response = await axios.post(
      `${PAYSTACK_API_URL}/refund`,
      {
        transaction: transaction.transactionReference,
        customer_note: reason || 'Order cancelled',
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    transaction.status =
      response.data.data.status === 'processed' ? 'refunded' : 'refund_pending';
    transaction.paystackData = {
      ...transaction.paystackData,
      refund: response.data,
    };
    await transaction.save();

    order.paymentStatus = 'refunded';
    order.orderStatus = 'cancelled';
    await order.save();

    return response.data;
  } catch (error) {
    throw new AppError(
      `Failed to process refund: ${error.response?.data?.message || error.message}`,
      500
    );
  }
};

export const handleWebhook = async (event: any) => {
  try {
    if (event.event === 'charge.success') {
      const { reference } = event.data;
      await verifyPayment(reference);
    } else if (event.event === 'refund.processed') {
      const { reference } = event.data.transaction;
      const transaction = await TransactionModel.findOne({
        transactionReference: reference,
      });
      if (transaction) {
        transaction.status = 'refunded';
        transaction.paystackData = {
          ...transaction.paystackData,
          refund: event,
        };
        await transaction.save();

        const order = await OrderModel.findById(transaction.orderId);
        if (order) {
          order.paymentStatus = 'refunded';
          order.orderStatus = 'cancelled';
          await order.save();
        }
      }
    }
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    throw new AppError(`Failed to process webhook: ${error.message}`, 500);
  }
};
