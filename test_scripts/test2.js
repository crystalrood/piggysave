// this file get email threads from google's api and then gets the corresponding raw encoded messages per thread id
//
//
//
//


 const mongoose = require('mongoose');


//mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/test' || 'mongodb://localhost:27017/test');
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

const async = require('async');
const Message = require('../models/Message.js');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var gmail = google.gmail('v1');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('../client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Gmail API.

  //authorize(JSON.parse(content), listLabels);
  authorize(JSON.parse(content), listThreads);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}



//sub function to get message from gmail api
 function getMessage(i, auth, thread_id, callback) {
   gmail.users.messages.get({
     auth:auth,
     userId: 'crystal.wesnoski@gmail.com',
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
           email: 'crystal.wesnoski@gmail.com',
           date_extracted: date,
           thread_id: thread_id.id,
           encoded_message: response2['raw']
        }
       );
       console.log(thread_id.id)
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
       userId: 'crystal.wesnoski@gmail.com',
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

           getMessage(i ,auth, thread)

         }
       }
     });
   }
