// var quickstart = require('./quicksstart');
const async = require('async');
var message_data = []


exports.index = (req, res) => {

  res.render('privacy', {
    title: 'Privacy'
  });

};
