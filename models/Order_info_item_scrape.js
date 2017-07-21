const mongoose = require('mongoose');

const order_info_item_scrapeSchema = new mongoose.Schema({
  order_num: String,
  zipcode: String,
  image: String,
  quantity: String,
  unit_price: String,
  item_name: String,
  size: String,
  style: String,
  tracking_num: String,
  status: String},
  { timestamps: true }
);

const Order_info_item_scrape = mongoose.model('order_info_item_scrape', order_info_item_scrapeSchema);
module.exports = Order_info_item_scrape;
