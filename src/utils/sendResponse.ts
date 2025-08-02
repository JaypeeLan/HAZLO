import { Response } from 'express';

type ResponseStatus = 'success' | 'error';

interface SendResponseOptions<T> {
  res: Response;
  statusCode: number;
  status: ResponseStatus;
  message: string;
  data?: T;
}

export const sendResponse = <T>({
  res,
  statusCode,
  status,
  message,
  data,
}: SendResponseOptions<T>) => {
  return res.status(statusCode).json({
    status,
    message,
    data: data || null,
  });
};
