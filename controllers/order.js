const async = require('async');
const Order_info_item_scrape = require('../models/Order_info_item_scrape.js');
const Message = require('../models/Message.js');
const passport = require('passport');
var PythonShell = require('python-shell');
var mongoose = require('mongoose');
var fs = require('fs');
const User = require('../models/User');
mongoose.Promise = require('bluebird');

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
  process.env.GOOGLE_ID,
  process.env.GOOGLE_SECRET,
  process.env.GOOGLE_URIS
);

var gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client
});



//************************************************************************************************************************
//************************************************************************************************************************
//******************            Loading order page and performing initial scrape if new user     *************************
//************************************************************************************************************************
//************************************************************************************************************************



exports.getOrder = (req, res) => {
console.log('crystal line 107')
console.log(process.cwd())
  if(req.user && req.user.initial_scrape_state == 'need_initial'){
    console.log('crystal made it past user check and initial scrape')
    async.waterfall([
      //***************************************************************************************
      //*****   1st function scrapes user threads for the first time from gmail api    ********
      //***************************************************************************************
      function(callback) {
        //checking to see if the user has an initial status of need to scrape
         console.log('crystal made it to the first callback function in async waterfall')
          if (req.user.tokens[0].accessToken) {
              //setting oauth2Client credentials if user has a token set up
              oauth2Client.setCredentials({
              access_token: req.user.tokens[0].accessToken,
              refresh_token: req.user.refresh_token[0].refreshToken
            });
            var retailers = ['contact@em.nordstrom.com']
            var key_words = '{subject:order subject:in process}'
            var lookback = ' newer_than:180d '
            query = 'in: anywhere,' + retailers +','+ key_words + ',' + lookback
            gmail.users.threads.list({
              auth: oauth2Client,
              userId: req.user.email,
              q: query
            }, function(err, response) {
              if (err) {
                console.log('The API returned an error: ' + err);
                return;
              }
              var threads = response['threads']
              //dis don't work 10-20-2017
              try {
                if (threads.length == 0) {
                  console.log('no threads found that match critera');
                } else {
                  var j = 0
                  for (var i = 0; i < threads.length; i++) {
                    var thread = threads[i];
                    console.log(req.user.email)
                    //getMessage(i , req.user.email, thread)
                    gmail.users.messages.get({
                      auth: oauth2Client,
                      userId: req.user.email,
                      id: thread.id,
                      format: 'raw'
                    },
                      function(err, response2) {
                        if (err) {
                          console.log('The API returned an error: ' + err);
                          return;
                        }
                        var mongoose = require('mongoose');
                        var ObjectId =  mongoose.Types.ObjectId;
                        var x = new ObjectId();
                        var date = new Date().getTime()
                        const email_thread = new Message(
                          {
                            _id: x,
                            email: req.user.email,
                            date_extracted: date,
                            thread_id: thread.id,
                            encoded_message: response2['raw'],
                            status: 'need to scrape'
                         }
                        );
                        email_thread.save();
                        j++;
                        console.log('saved thread')
                        console.log(j)
                        if (j==threads.length){
                          callback(null, 'next1');
                        }
                     })
                  }
                }
              }catch(e){
                if(e){callback(null, 'next1');}
              }    
            });
          }
      },
      //***************************************************************************************
      //***** 2nd function calls email_info_scrape.py which scrapes info from the thread saved in function 1
      //***** parameters scrape are: ('thread_id','email', 'retailer', 
      //***** 'date', 'order_num', 'billing_address', 'zipcode')
      //***** This information serves as an input to get the items within the order to track
      //***** Information is saved into order_info_from_email
      //***************************************************************************************
      function(arg1, callback) {
          var PythonShell = require('python-shell');
          var path = process.cwd()+'/public/test_scripts/piggy_main_scripts/'
          var pyshell = new PythonShell('email_info_scrape.py', {scriptPath:path, pythonOptions: ['-u']});
          pyshell.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            console.log(message);
          });
          // end the input stream and allow the process to exit
          pyshell.end(function (err) {
            if (err) throw err;
            console.log('finished first python scrape');
            console.log(arg1)
            callback(null, 'next3');
          });
      },
      //***************************************************************************************
      //***** 3rd function calls nordstrom_scrape_order_info.py which goes into the order and
      //***** and scrape the individual items within the order and collects the following pieces
      //***** of data: 'order_num','zipcode', 'image', 'quantity', 'unit_price', 'item_name', 
      //***** 'size', 'style', 'tracking_num'
      //***** this data is saved into order_info_item_scrapes
      //***************************************************************************************
      function(arg1, callback) {
          var PythonShell = require('python-shell');
          var path = process.cwd()+'/public/test_scripts/piggy_main_scripts/'
          var pyshell = new PythonShell('nordstrom_scrape_order_info.py',{scriptPath: path, pythonOptions: ['-u']});
          pyshell.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            console.log(message);
          });
          // end the input stream and allow the process to exit
          pyshell.end(function (err) {
            if (err) throw err;
            console.log('finished second python scrape');
            console.log(arg1)
            callback(null, 'next3');
          });
      },
      //***************************************************************************************
      //***** 4th function calls sets the user profile in the DB to "scraped" regardless of 
      //***** if actual information was scraped
      //***************************************************************************************
      function(arg1, callback) {
            User.update(
              {'email': req.user.email }
              ,{$set:{'initial_scrape_state':'complete'}}
              , function(err, result) {
                    if (err) {console.log(err);}
                    else {console.log('saved')}
                }
            )
        console.log('task2')
        callback(null, 'next2');
      },
    ], function (err, arg1) {
      console.log(arg1)
      try {
        Order_info_item_scrape.find({ email: req.user.email }, (err, docs) => {
            res.render('orders', {orders: docs});
        });
      }catch(e){
        if(e){
          res.render('orders');
        }
      }     
  });
  }
  else{
     try {
        Order_info_item_scrape.find({ email: req.user.email }, (err, docs) => {
            res.render('orders', {orders: docs});
        });
      }catch(e){
        if(e){
          res.render('orders');
        }
      }     
  }
  
//res.render('orders');
};