import { model, Schema } from 'mongoose';

const ordersSchema = new Schema({
  itemName: { type: String, default: null },
});

const OrdersModel = model('order', ordersSchema);

export default OrdersModel;
