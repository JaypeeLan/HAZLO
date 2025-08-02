import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from '../middlewares/logger';

const app = express();

app.use(cors());
app.use(helmet());
app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World');
});

export default app;
