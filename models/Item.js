const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  retailer: String,
  url: String,
  price: String,
  image_link: String,
  item_id: Number,
  name: String},
  { timestamps: true }
);

const Item = mongoose.model('item', itemSchema);
module.exports = Item;
