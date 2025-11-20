import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/user';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../middlewares/errorHandler';
import { IUser } from '../models/user';
import { formatUser } from '../utils/helpers';

interface DeletionAccountDoc {
  _id: string;
  email: string;
  name: string;
  role: string;
  updatedAt: Date;
}

const formatAccount = (account: DeletionAccountDoc) => ({
  id: account._id.toString(),
  email: account.email,
  name: account.name,
  role: account.role,
  requestedAt: account.updatedAt,
});

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { status } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    if (status !== 'request' && status !== 'revert') {
      throw new AppError(
        'Invalid status provided. Must be "request" or "revert".',
        400
      );
    }

    let isForDeleteValue: boolean;
    let successMessage: string;

    if (status === 'request') {
      isForDeleteValue = true;
      successMessage =
        'Account deletion requested. Your account is marked for deletion.';
    } else {
      isForDeleteValue = false;
      successMessage = 'Account deletion request successfully reverted.';
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isForDelete: isForDeleteValue },
      { new: true }
    );

    if (!updatedUser) {
      throw new AppError('User not found.', 404);
    }

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: successMessage,
      data: formatUser(updatedUser as IUser),
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to update account deletion status', 500)
    );
  }
};

export const getAccountsForDeletion = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = {
      isForDelete: true,
    };

    const accounts = (await UserModel.find(filter)
      .select('_id email name role updatedAt')
      .lean()) as DeletionAccountDoc[];

    const formattedAccounts = accounts.map(formatAccount);

    sendResponse({
      res,
      statusCode: 200,
      status: 'success',
      message: `Found ${formattedAccounts.length} accounts marked for deletion.`,
      data: formattedAccounts,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError('Failed to retrieve accounts for deletion', 500)
    );
  }
};
