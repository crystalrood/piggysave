const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  email: String,
  thread_id: String,
  date_extracted: String,
  encoded_message: String,
  status: String},
  { timestamps: true }
);

const Message = mongoose.model('message', messageSchema);
module.exports = Message;
