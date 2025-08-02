import mongoose from 'mongoose';
import { ENV } from '../config/env';

const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('DB Connected ');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
