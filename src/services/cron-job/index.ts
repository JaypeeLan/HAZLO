import cron from 'node-cron';

export const warmRenderServer = () => {
  // Run every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    try {
      const response = await fetch('https://hazlo-l3io.onrender.com/');
      console.log(`Warm-up request sent. Status: ${response.status}`);
    } catch (error) {
      console.error('Error warming Render server:', error);
    }
  });
};
