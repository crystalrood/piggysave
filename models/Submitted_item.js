const mongoose = require('mongoose');

const submitted_itemSchema = new mongoose.Schema({
  email: String,
  item_url: String},
  { timestamps: true }
);

const Submitted_item = mongoose.model('submitted_item', submitted_itemSchema);
module.exports = Submitted_item;
