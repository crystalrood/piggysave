var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
  process.env.GOOGLE_ID,
  process.env.GOOGLE_SECRET,
  process.env.REDIRECT_URIS
);

var gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client
});

google.options({ auth: oauth2Client });

oauth2Client.setCredentials({
  access_token: req.user.tokens[0].accessToken,
  // Optional, provide an expiry_date (milliseconds since the Unix Epoch)
  // expiry_date: (new Date()).getTime() + (1000 * 60 * 60 * 24 * 7)
});


//sub function to get message from gmail api
 function getMessage(i, auth, thread_id, callback) {
   gmail.users.messages.get({
     auth:auth,
     userId: req.user.email,
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
           email: req.user.email,
           date_extracted: date,
           thread_id: thread_id.id,
           encoded_message: response2['raw']
        }
       );

       email_thread.save();

    }
  )

 }


function listThreads(auth) {

  var mongoose = require('mongoose');
  mongoose.Promise = require('bluebird');

  var message
  //only focusing on nordstrom , 'VictoriasSecret@e1.victoriassecret.com','help@walmart.com', 'BestBuyInfo@emailinfo.bestbuy.com'
  var retailers = ['contact@em.nordstrom.com']
  var key_words = '{subject:order subject:reciept subject:confirmation subject:purchase}'
  query = 'in: anywhere,' + retailers +','+ key_words
  //console.log(query)
  var gmail = google.gmail('v1');
  gmail.users.threads.list({
    auth: auth,
    userId: 'me',
    q: query
  }, function(err, response) {
    if (err) {

      console.log('The API returned an error: ' + err);
      return;
    }

    var threads = response['threads']
    if (threads.length == 0) {

      console.log('No labels found.');

    } else {

      for (var i = 0; i < threads.length; i++) {
        var thread = threads[i];
        console.log(req.user.email)

        getMessage(i ,auth, thread)

      }
    }
  });

}
