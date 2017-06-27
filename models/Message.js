const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userid: String,
  email: String,
  thread_id: String,
  date_extracted: String,
  encoded_message: String},
  { timestamps: true }
);

const Message = mongoose.model('message', messageSchema);
module.exports = Message;
