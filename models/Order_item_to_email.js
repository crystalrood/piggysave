const mongoose = require('mongoose');

const order_item_to_emailSchema = new mongoose.Schema({
  order_num: String,
  quantity: String,
  purchase_price: String,
  item_name: String,
  date_placed: String,
  email: String,
  retailer: String,
  thread_id: String,
  date_price_reduce: String,
  reduced_price: String,
  price_difference: String,
  link_to_product: String,
  status: String},
  { timestamps: true }
);

const Order_item_to_email = mongoose.model('order_item_to_email', order_item_to_emailSchema);
module.exports = Order_item_to_email;
