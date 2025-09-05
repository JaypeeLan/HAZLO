import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT,
  ENVIRONMENT: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGO_URI:
    process.env.NODE_ENV === 'development'
      ? process.env.MONGODB_URI_TEST
      : process.env.NODE_ENV === 'staging'
        ? process.env.STAGING_MONGO_URL
        : process.env.HAZLO_MONGO_URI,
  // TWILIO_SID: process.env.TWILIO_SID_TEST,
  // TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN_TEST,
  // TWILIO_SMS_VERIFY_SERVICE: process.env.TWILIO_SMS_VERIFY_SERVICE_TEST,
  // SEND_GRID: process.env.SEND_GRID_TEST,
  CLOUDINARY_API_KEY:
    process.env.NODE_ENV === 'development'
      ? process.env.CLOUDINARY_API_KEY_TEST
      : process.env.HAZLO_CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET:
    process.env.NODE_ENV === 'development'
      ? process.env.CLOUDINARY_API_SECRET_TEST
      : process.env.HAZLO_CLOUDINARY_API_SECRET,
  CLOUDINARY_NAME:
    process.env.NODE_ENV === 'development'
      ? process.env.CLOUDINARY_NAME_TEST
      : process.env.HAZLO_CLOUDINARY_NAME,
  BASE_URL: process.env.BASE_URL,
  PAYSTACK_KEY: process.env.PAYSTACK_KEY_TEST,
  UPLOAD_FILE_KEY: process.env.UPLOAD_FILE_KEY,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
  GMAIL_PASS: process.env.GMAIL_PASS,
  GMAIL_USER: process.env.GMAIL_USER,
};
