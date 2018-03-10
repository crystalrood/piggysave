const mongoose = require('mongoose');

const item_to_userSchema = new mongoose.Schema({
	retailer: String, 
	condensed: String, 
	price: String, 
	image_link: String, 
	item_name: String,
	email: String, 
	has_account: String, 
	date_submitted: String, 
	followup_date: String, 
	send_email_flag: String, 
	last_price: String, 
	last_date_checked: String, 
	low_price: String, 
	low_price_date: String, 
	high_price: String, 
	high_price_date: String
},
  { timestamps: true }
);

const Item_to_user = mongoose.model('item_to_user', item_to_userSchema);
module.exports = Item_to_user;
