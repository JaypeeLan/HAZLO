import mongoose, { model } from 'mongoose';

const transactionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  transactionReference: { type: String, required: true, unique: true }, // Paystack reference
  amount: { type: Number, required: true }, // In kobo
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refund_pending', 'refunded'],
    default: 'pending',
  },
  paystackData: { type: Object }, // Store full Paystack response for auditing
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const TransactionModel = model('Transaction', transactionSchema);
export default TransactionModel;
