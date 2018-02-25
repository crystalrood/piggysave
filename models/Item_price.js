const mongoose = require('mongoose');

const item_priceSchema = new mongoose.Schema({
  url: String,
  item_id: Number,
  item_price: String,
  date: String,
  lowest_price: String,
  highest_price: String, 
  first_price: String,	
  date_of_first_price: String,	
  is_new_low: String,	
},
  { timestamps: true }
);

const Item_price = mongoose.model('item_price', item_priceSchema);
module.exports = Item_price;
