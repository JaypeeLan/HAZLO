import cron from 'node-cron';
import express from 'express';

const app = express();

export const warmRenderServer = () => {
  cron.schedule('0 */2 * * *', () => {
    app.get('https://hazlo-l3io.onrender.com/api/v1/', (req, res) => {
      res.status(200).send('cron job ran successfully');

      console.log('cron job ran successfully');
    });
  });
};
