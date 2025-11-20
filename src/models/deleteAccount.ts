import { model, Schema } from 'mongoose';

const deleteAccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const DeleteAccount = model('DeleteAccount', deleteAccountSchema);
