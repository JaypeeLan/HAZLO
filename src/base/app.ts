import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from '../middlewares/logger';
import routes from '../routes';
import {
  globalErrorHandler,
  notFoundHandler,
} from '../middlewares/errorHandler';
import { validateRequests } from '../middlewares/validator';
import { warmRenderServer } from '../services/cron-job';

const app = express();

app.use(cors());
app.use(helmet());
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', validateRequests, routes);
//  for cron job
app.get('/', (_, res) => {
  res.status(200).json({ status: 'success' });
});

warmRenderServer();

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
