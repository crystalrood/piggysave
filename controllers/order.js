const async = require('async');
const Order_info_item_scrape = require('../models/Order_info_item_scrape.js');
const Message = require('../models/Message.js');
var message_data = []
const passport = require('passport');

exports.getOrder = (req, res) => {

  Order_info_item_scrape.find((err, docs) => {
    //console.log(docs)
    res.render('orders', {orders: docs});
  });

};
