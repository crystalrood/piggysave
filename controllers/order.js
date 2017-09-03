const async = require('async');
const Order_info_item_scrape = require('../models/Order_info_item_scrape.js');
const Message = require('../models/Message.js');
const passport = require('passport');
var mongoose = require('mongoose');
var fs = require('fs');
mongoose.Promise = require('bluebird');

var message_data = []

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
  "582437152045-pkb7bgnetap50evvvc8lkde2nfb4q3as.apps.googleusercontent.com",
  "w06GC7IFKMAUVH3_anGTDO0q",
  //"http://localhost:3000/auth/google/callback/"
);

var gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client
});




//sub function to get message from gmail api
//**********//**********//**********//**********
function getMessage(i, email ,thread_id, callback) {
   gmail.users.messages.get({
     auth:oauth2Client,
     userId: email,
     id: thread_id.id,
     format: 'raw'
   },
     function(err, response2) {
       if (err) {
         console.log('The API returned an error: ' + err);
         return;
       }

       //for some reason i needed to create an _id to save to mongoose...:(
       var mongoose = require('mongoose');
       var ObjectId =  mongoose.Types.ObjectId;
       var x = new ObjectId();

       var date = new Date().getTime()
       const email_thread = new Message(
         {
           _id: x,
           userid: 'user_id',
           email: email,
           date_extracted: date,
           thread_id: thread_id.id,
           encoded_message: response2['raw']
        }
       );
       email_thread.save();
    })
 }
//**********//**********//**********//**********
//**********//**********//**********//**********


exports.getOrder = (req, res) => {

  if (req.user.initial_scrape_state == 'need_initial') {

    console.log('here')


    if (req.user.tokens[0].accessToken) {
        oauth2Client.setCredentials({
        access_token: req.user.tokens[0].accessToken,
        refresh_token: req.user.refresh_token[0].refresh_token
      });
    }


    var message

    var retailers = ['contact@em.nordstrom.com']
    var key_words = '{subject:order subject:reciept subject:confirmation subject:purchase}'
    query = 'in: anywhere,' + retailers +','+ key_words
    //console.log(query)
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
      if (threads.length == 0) {
        console.log('no threads found that match critera');
      } else {
        for (var i = 0; i < threads.length; i++) {
          var thread = threads[i];
          console.log(req.user.email)
          //getMessage(i , req.user.email, thread)

        }
      }
    });
  }


  Order_info_item_scrape.find((err, docs) => {
    res.render('orders', {orders: docs});
  });

};
