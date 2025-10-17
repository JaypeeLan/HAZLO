import mongoose from 'mongoose';
import { ENV } from '../config/env';

const connectDB = async () => {
  console.log(ENV.MONGO_URI);
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('DB Connected ');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
