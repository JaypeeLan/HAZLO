import { UserType } from './index.types';

declare global {
  namespace Express {
    interface Request {
      user?: UserType;
    }
  }
}
