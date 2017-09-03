const async = require('async');
const Order_info_item_scrape = require('../models/Order_info_item_scrape.js');
const Message = require('../models/Message.js');
const passport = require('passport');
var mongoose = require('mongoose');
var fs = require('fs');
const User = require('../models/User');
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
     auth: oauth2Client,
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
       //email_thread.save();
    })
 }


function getThreads(email) {
  var retailers = ['contact@em.nordstrom.com']
  var key_words = '{subject:order subject:reciept subject:confirmation subject:purchase}'
  query = 'in: anywhere,' + retailers +','+ key_words

  gmail.users.threads.list({
    auth: oauth2Client,
    userId: email,
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
        console.log(email)
        getMessage(i , email, thread)
      }
    }
  });

}

//**********//**********//**********//**********
//**********//**********//**********//**********


exports.getOrder = (req, res) => {

  //checking to see if the user has an initial status of need to scrape
  if (req.user.initial_scrape_state == 'need_initial') {

    //setting access token given the user is logged in
    // also we only want to check if the user has an access token on file
    if (req.user.tokens[0].accessToken) {

        //setting oauth2Client credentials
        oauth2Client.setCredentials({
        access_token: req.user.tokens[0].accessToken,
        refresh_token: req.user.refresh_token[0].refreshToken
      });

      //
      getThreads(req.user.email);

      //here if the user is new, and we're done scraping their emails,
      //we're saving their new status to complete

      User.update(
        {'email': req.user.email }
        ,{$set:{'initial_scrape_state':'complete'}}
        , function(err, result) {
              if (err) {console.log(err);}
              else {console.log('saved')}
          }
      )
    } // end of checking to see if user has an access token
  }; //end of checking user status


  Order_info_item_scrape.find((err, docs) => {
    res.render('orders', {orders: docs});
  });

};
