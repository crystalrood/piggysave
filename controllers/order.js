const async = require('async');
const Order_info_item_scrape = require('../models/Order_info_item_scrape.js');
const Message = require('../models/Message.js');
const passport = require('passport');
var PythonShell = require('python-shell');
var mongoose = require('mongoose');
var fs = require('fs');
const User = require('../models/User');
mongoose.Promise = require('bluebird');

var message_data = []

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
           email: email,
           date_extracted: date,
           thread_id: thread_id.id,
           encoded_message: response2['raw']
        }
       );
       email_thread.save();
       console.log('saved thread')
    })
    console.log('counter is ' + i)
 }


function getThreads(email, callback) {
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
    console.log(threads.length)
    if (threads.length == 0) {
      console.log('no threads found that match critera');
    } else {
      for (var i = 0; i < threads.length; i++) {
        var thread = threads[i];
        console.log(email)
        getMessage(i , email, thread)
      }
      if (i==threads.length){
        //callback(null);
      }
    }
  });
}

//**********//**********//**********//**********
//**********//**********//**********//**********


exports.getOrder = (req, res) => {
console.log(process.cwd())
  if(req.user){
    async.waterfall([

      function(callback) {
        //checking to see if the user has an initial status of need to scrape
        if (req.user.initial_scrape_state == 'need_initial') {
          console.log(req.user.tokens[0].accessToken)
          if (req.user.tokens[0].accessToken) {
              //setting oauth2Client credentials if user has a token set up
              oauth2Client.setCredentials({
              access_token: req.user.tokens[0].accessToken,
              refresh_token: req.user.refresh_token[0].refreshToken
            });
            //getThreads(req.user.email, callback);
            //callback(null, 'next1');


  ///*
            var retailers = ['contact@em.nordstrom.com']
            var key_words = '{subject:order subject:reciept subject:confirmation subject:purchase}'
            var lookback = ' newer_than:60d'
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
            });
            //*/
          }
        }
        //else{
        //  callback(null, 'next1');
        //}

      },

      function(arg1, callback) {
        //in this subfunction i want to call the python scraper :D
        if (req.user.initial_scrape_state == 'need_initial') {

          var PythonShell = require('python-shell');
          var path = process.cwd()+'/public/test_scripts/'
          var pyshell = new PythonShell('test.py', {scriptPath:path, pythonOptions: ['-u']});
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

        }
        else{
          callback(null, 'next1');
        }

      },

      function(arg1, callback) {
        //in this subfunction i want to call the python scraper :D
        if (req.user.initial_scrape_state == 'need_initial') {

          var PythonShell = require('python-shell');
          var path = process.cwd()+'/public/test_scripts/'
          var pyshell = new PythonShell('test_scrape_nordstrom.py',{scriptPath: path, pythonOptions: ['-u']});

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

        }

        else{
          callback(null, 'next1');
        }

      },

      function(arg1, callback) {
          if (req.user.initial_scrape_state == 'need_initial') {
            User.update(
              {'email': req.user.email }
              ,{$set:{'initial_scrape_state':'complete'}}
              , function(err, result) {
                    if (err) {console.log(err);}
                    else {console.log('saved')}
                }
            )
          };
        console.log('task2')
        callback(null, 'next2');
      },
    ], function (err, arg1) {
      console.log(arg1)
      Order_info_item_scrape.find((err, docs) => {
          res.render('orders', {orders: docs});
      });
      console.log('result')
  });
  }
  else{

    res.render('orders')
  }

};
