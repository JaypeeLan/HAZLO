import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import connectDB from './db';
import logger from '../middlewares/logger';
import { ENV } from '../config/ENV';

const app = express();

app.use(cors());
app.use(helmet());
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World');
});

const PORT = ENV.PORT || 3000;
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
