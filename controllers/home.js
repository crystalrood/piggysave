// var quickstart = require('./quicksstart');
const async = require('async');
const Item = require('../models/Item.js');
const Item_to_user = require('../models/Item_to_user.js');
const Item_price = require('../models/Item_price.js');
const Submitted_item = require('../models/Submitted_item.js');
const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const nodemailer = require('nodemailer');
const User = require('../models/User');



exports.index = (req, res, next) => {

  res.render('home', {
    title: 'Home'
  });

};


/*
------- Posting information from webform for employees
*/

exports.postFormsubmit = (req, res, next) => {


  /* define what needs to be saved*/
  const submitted_item = new Submitted_item({
      email: req.body.email,
      item_url: req.body.url
   });

    submitted_item.save((err) => {
      /* this provides a block if the error is that hte email address is already associated with an employee*/
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
          return res.redirect('/');
        }
        return next(err);
      }
      console.log("SAVED!");
      req.flash('success', { msg: 'This has been saved!' });
      res.redirect('/');

})
  
};

