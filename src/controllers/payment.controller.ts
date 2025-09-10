import { NextFunction, Request, Response } from 'express';
import * as paymentService from '../services/paystack/paymentService';
import crypto from 'crypto';
import { AppError } from '../middlewares/errorHandler';
import { ENV } from '../config/env';
import { sendResponse } from '../utils/sendResponse';

import { messaging } from '../services/firebase/admin';
import UserModel from '../models/user';
import NotificationModel from '../models/notification';
import OrderModel from '../models/order';

export const initializeOrderPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const email = req.user.email;
    const paymentData = await paymentService.initializePayment(orderId, email);

    try {
      const user = await UserModel.findById(req.user.id).select('deviceToken');
      if (user?.deviceToken) {
        const message = {
          notification: {
            title: 'Payment Initialization',
            body: `Payment for order ${orderId} has been initialized.`,
          },
          token: user.deviceToken,
        };
        await messaging.send(message);
        await NotificationModel.create({
          user: req.user.id,
          title: 'Payment Initialization',
          message: `Payment for order ${orderId} has been initialized.`,
          type: 'payment',
          read: false,
          metadata: { orderId },
        });
      }
    } catch (notifyError) {
      console.error(
        'Failed to send initializeOrderPayment notification:',
        notifyError
      );
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Payment initialized,',
      data: {
        ...paymentData,
        callback: `${ENV.BASE_URL}/payments/callback`,
      },
    });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error, 500));
  }
};

export const verifyOrderPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reference } = req.query;
    const verification = await paymentService.verifyPayment(
      reference as string
    );

    try {
      const user = await UserModel.findById(req.user.id).select('deviceToken');
      if (user?.deviceToken) {
        const message = {
          notification: {
            title: 'Payment Verified',
            body: `Your payment with reference ${reference} has been verified.`,
          },
          token: user.deviceToken,
        };
        await messaging.send(message);
        await NotificationModel.create({
          user: req.user.id,
          title: 'Payment Verified',
          message: `Your payment with reference ${reference} has been verified.`,
          type: 'payment',
          read: false,
          metadata: { reference },
        });
      }
    } catch (notifyError) {
      console.error(
        'Failed to send verifyOrderPayment notification:',
        notifyError
      );
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Payment verified,',
      data: verification,
    });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error, 500));
  }
};

export const refundOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const refundData = await paymentService.createRefund(
      orderId,
      reason || 'Order cancelled'
    );

    try {
      const user = await UserModel.findById(req.user.id).select('deviceToken');
      if (user?.deviceToken) {
        const message = {
          notification: {
            title: 'Refund Processed',
            body: `A refund for order ${orderId} has been processed.`,
          },
          token: user.deviceToken,
        };
        await messaging.send(message);
        await NotificationModel.create({
          user: req.user.id,
          title: 'Refund Processed',
          message: `A refund for order ${orderId} has been processed.`,
          type: 'refund',
          read: false,
          metadata: { orderId, reason },
        });
      }
    } catch (notifyError) {
      console.error('Failed to send refundOrder notification:', notifyError);
    }

    res.status(200).json({ success: true, data: refundData });
    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: 'Payment initialized,',
      data: refundData,
    });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error, 500));
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

    const event = JSON.parse(rawBody.toString());
    await paymentService.handleWebhook(event);

    try {
      const userId = event.data?.metadata?.userId;
      if (userId) {
        const user = await UserModel.findById(userId).select('deviceToken');
        if (user?.deviceToken) {
          const message = {
            notification: {
              title: `Payment ${event.event}`,
              body: `Your payment status is now: ${event.data.status}`,
            },
            token: user.deviceToken,
          };
          await messaging.send(message);
          await NotificationModel.create({
            user: userId,
            title: `Payment ${event.event}`,
            message: `Your payment status is now: ${event.data.status}`,
            type: 'payment',
            read: false,
            metadata: event.data,
          });
        }
      }
    } catch (notifyError) {
      console.error('Failed to send webhookHandler notification:', notifyError);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const callbackHandler = async (req: Request, res: Response) => {
  try {
    const { reference, trxref } = req.query;

    // Use reference or trxref (Paystack sends both)
    const paymentReference = reference || trxref;

    if (!paymentReference) {
      // No payment reference found
      return res.send(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Error</title>
          </head>
          <body>
            <script>
              const errorData = {
                type: 'PAYMENT_ERROR',
                message: 'No payment reference found'
              };

              // Send message to Flutter WebView
              if (window.PaymentHandler) {
                window.PaymentHandler.postMessage(JSON.stringify(errorData));
              }
              
              // Fallback - try to close window
              setTimeout(() => {
                try {
                  window.close();
                } catch(e) {
                  history.back();
                }
              }, 2000);
            </script>
            <div style="text-align: center; padding: 50px; font-family: Arial;">
              <h3 style="color: red;">❌ Payment Error</h3>
              <p>No payment reference found. Please close this window.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Verify the payment
    let verification;
    try {
      verification = await paymentService.verifyPayment(
        paymentReference as string
      );
    } catch (error: any) {
      // Payment verification failed
      return res.send(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Failed</title>
          </head>
          <body>
            <script>
              const failureData = {
                type: 'PAYMENT_FAILED',
                reference: '${paymentReference}',
                message: '${error} Payment verification failed'
              };

              // Send message to Flutter WebView
              if (window.PaymentHandler) {
                window.PaymentHandler.postMessage(JSON.stringify(failureData));
              }
              
              setTimeout(() => {
                try {
                  window.close();
                } catch(e) {
                  history.back();
                }
              }, 2000);
            </script>
            <div style="text-align: center; padding: 50px; font-family: Arial;">
              <h3 style="color: red;">❌ Payment Failed</h3>
              <p>Payment could not be verified. This window will close automatically.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Check payment status
    if (verification.data.status === 'success') {
      // Payment successful - send push notification
      try {
        const orderId = verification.data.metadata?.orderId;
        if (orderId) {
          // Find the order to get user details
          const order = await OrderModel.findById(orderId).populate('userId');
          if (order && order.customerId) {
            const user = await UserModel.findById(order.customerId).select(
              'deviceToken'
            );
            if (user?.deviceToken) {
              const message = {
                notification: {
                  title: 'Payment Successful! 🎉',
                  body: `Your payment for order #${order.orderId} has been completed successfully.`,
                },
                data: {
                  type: 'PAYMENT_SUCCESS',
                  orderId: order.orderId,
                  reference: paymentReference as string,
                  action: 'CLOSE_PAYMENT_VIEW',
                },
                token: user.deviceToken,
              };
              await messaging.send(message);

              // Save notification to database
              await NotificationModel.create({
                user: order.customerId,
                title: 'Payment Successful! 🎉',
                message: `Your payment for order #${order.orderId} has been completed successfully.`,
                type: 'payment',
                read: false,
                metadata: {
                  orderId: order.orderId,
                  reference: paymentReference,
                  amount: verification.data.amount / 100, // Convert from kobo
                },
              });
            }
          }
        }
      } catch (notifyError) {
        console.error(
          'Failed to send payment success notification:',
          notifyError
        );
      }

      // Return success HTML for Flutter WebView
      return res.send(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful</title>
          </head>
          <body>
            <script>
              const successData = {
                type: 'PAYMENT_SUCCESS',
                reference: '${paymentReference}',
                orderId: '${verification.data.metadata?.orderId || ''}',
                amount: ${verification.data.amount},
                currency: '${verification.data.currency || 'NGN'}',
                message: 'Payment completed successfully',
                timestamp: new Date().toISOString()
              };

              // Send success message to Flutter WebView
              if (window.PaymentHandler) {
                window.PaymentHandler.postMessage(JSON.stringify(successData));
              }
              
              // Close the webview after a short delay
              setTimeout(() => {
                try {
                  window.close();
                } catch(e) {
                  // Can't close, that's fine
                }
              }, 1500);
            </script>
            <div style="text-align: center; padding: 50px; font-family: Arial; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
              <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
                <h2 style="color: white; margin: 0; font-size: 24px;">Payment Successful!</h2>
                <p style="margin: 15px 0; font-size: 16px; opacity: 0.9;">
                  Your payment has been processed successfully.
                </p>
                <p style="margin: 10px 0; font-size: 14px; opacity: 0.7;">
                  Reference: ${paymentReference}
                </p>
                <p style="margin: 20px 0; font-size: 14px; opacity: 0.8;">
                  This window will close automatically...
                </p>
              </div>
            </div>
          </body>
        </html>
      `);
    } else {
      // Payment failed
      return res.send(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Failed</title>
          </head>
          <body>
            <script>
              const failureData = {
                type: 'PAYMENT_FAILED',
                reference: '${paymentReference}',
                message: 'Payment was not successful',
                status: '${verification.data.status}',
                timestamp: new Date().toISOString()
              };

              // Send failure message to Flutter WebView
              if (window.PaymentHandler) {
                window.PaymentHandler.postMessage(JSON.stringify(failureData));
              }
              
              setTimeout(() => {
                try {
                  window.close();
                } catch(e) {
                  history.back();
                }
              }, 2000);
            </script>
            <div style="text-align: center; padding: 50px; font-family: Arial; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
              <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
                <h3 style="color: white; margin: 0; font-size: 22px;">Payment Failed</h3>
                <p style="margin: 15px 0; font-size: 16px; opacity: 0.9;">
                  Your payment was not successful.
                </p>
                <p style="margin: 10px 0; font-size: 14px; opacity: 0.7;">
                  Reference: ${paymentReference}
                </p>
                <p style="margin: 20px 0; font-size: 14px; opacity: 0.8;">
                  This window will close automatically...
                </p>
              </div>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error: any) {
    console.error('Callback handler error:', error);

    return res.send(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Error</title>
        </head>
        <body>
          <script>
            const errorData = {
              type: 'PAYMENT_ERROR',
              message: 'An error occurred processing your payment',
              error: '${error.message}',
              timestamp: new Date().toISOString()
            };

            // Send error message to Flutter WebView
            if (window.PaymentHandler) {
              window.PaymentHandler.postMessage(JSON.stringify(errorData));
            }
            
            setTimeout(() => {
              try {
                window.close();
              } catch(e) {
                history.back();
              }
            }, 2000);
          </script>
          <div style="text-align: center; padding: 50px; font-family: Arial; background: #f8f9fa; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
              <h3 style="color: #dc3545; margin: 0;">Error Occurred</h3>
              <p style="margin: 15px 0; color: #666;">
                An error occurred while processing your payment.
              </p>
              <p style="margin: 20px 0; font-size: 14px; color: #999;">
                This window will close automatically...
              </p>
            </div>
          </div>
        </body>
      </html>
    `);
  }
};
