const mongoose = require('mongoose');

const order_info_item_scrapeSchema = new mongoose.Schema({
  order_num: String,
  zipcode: String,
  image: String,
  quantity: String,
  purchase_price: String,
  item_name: String,
  size: String,
  style: String,
  tracking_num: String,
  date_placed: String,
  email: String,
  retailer: String,
  thread_id: String,
  status: String,
  date_price_reduce: String,
  reduced_price: String,
  date_refunded_difference: String,
  price_difference: String,
  link_to_product: String,
  image_link_2: String,
  item_name_2: String},
  { timestamps: true }
);

const Order_info_item_scrape = mongoose.model('order_info_item_scrape', order_info_item_scrapeSchema);
module.exports = Order_info_item_scrape;
