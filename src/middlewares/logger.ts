import { Request, Response, NextFunction } from 'express';

const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const elapsed = Date.now() - start;
    const log = `${req.method} ${req.originalUrl} ${res.statusCode} - ${elapsed}ms`;
    console.log(log);
  });

  next();
};

export default logger;
