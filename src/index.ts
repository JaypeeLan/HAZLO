import app from './base/app';
import connectDB from './base/db';
import { ENV } from './config/ENV';

const PORT = ENV.PORT || 3000;
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
