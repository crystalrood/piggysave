// var quickstart = require('./quicksstart');
const async = require('async');
const Message = require('../models/Message.js');
var message_data = []


exports.index = (req, res) => {

  res.render('home', {
    title: 'Home'
  });

};
