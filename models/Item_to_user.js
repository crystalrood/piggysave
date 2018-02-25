const mongoose = require('mongoose');

const item_to_userSchema = new mongoose.Schema({
  email: String,
  confirmation: String,
  item_id: Number,
  date_added: String,
  follow_up: String,
  is_authentic: String},
  { timestamps: true }
);

const Item_to_user = mongoose.model('item_to_user', item_to_userSchema);
module.exports = Item_to_user;
