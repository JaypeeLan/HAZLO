import { model, Schema } from 'mongoose';

const ordersSchema = new Schema({
  itemName: { type: String, default: null },
});

const OrdersModel = model('Order', ordersSchema);

export default OrdersModel;
