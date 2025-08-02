import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT,
  ENVIRONMENT: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGO_URI: process.env.MONGODB_URI_TEST,
  TWILIO_SID: process.env.TWILIO_SID_TEST,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN_TEST,
  TWILIO_SMS_VERIFY_SERVICE: process.env.TWILIO_SMS_VERIFY_SERVICE_TEST,
  SEND_GRID: process.env.SEND_GRID_TEST,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY_TEST,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET_TEST,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL_TEST,
  BASE_URL: process.env.BASE_URL,
  PAYSTACK_KEY: process.env.PAYSTACK_KEY_TEST,
  NGROK_KEY: process.env.NGROK_URL,
};
