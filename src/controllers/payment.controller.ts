import { NextFunction, Request, Response } from 'express';
import * as paymentService from '../services/paystack/paymentService';
import crypto from 'crypto';
import { AppError } from '../middlewares/errorHandler';
import { ENV } from '../config/env';

export const initializeOrderPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const email = req.user.email;
    const paymentData = await paymentService.initializePayment(orderId, email);

    res.status(200).json({ success: true, data: paymentData });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error, 500));
  }
};

export const verifyOrderPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.query;
    const verification = await paymentService.verifyPayment(
      reference as string
    );

    res.status(200).json({ success: true, data: verification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const refundOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const refundData = await paymentService.createRefund(
      orderId,
      reason || 'Order cancelled'
    );
    res.status(200).json({ success: true, data: refundData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const webhookHandler = async (req: Request, res: Response) => {
  try {
    const rawBody = req.body;

    const hash = crypto
      .createHmac('sha512', ENV.PAYSTACK_KEY)
      .update(rawBody)
      .digest('hex');

    const signature = req.headers['x-paystack-signature'] as string;

    if (hash !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse the JSON manually since we got raw body
    const event = JSON.parse(rawBody.toString());
    await paymentService.handleWebhook(event);

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
