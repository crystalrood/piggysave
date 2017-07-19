// this file get email threads from google's api and then gets the corresponding raw encoded messages per thread id
//
//
//
//

const async = require('async');
const Message = require('./models/Message.js');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
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

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  var retailers = ['contact@em.nordstrom.com', 'VictoriasSecret@e1.victoriassecret.com','help@walmart.com', 'BestBuyInfo@emailinfo.bestbuy.com']
  var key_words = '{subject:order subject:reciept subject:confirmation subject:purchase}'
  var gmail = google.gmail('v1');
  gmail.users.labels.list({
    auth: auth,
    userId: 'me',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var labels = response.labels;
    if (labels.length == 0) {
      console.log('No labels found.');
    } else {
      console.log('Labels:');
      for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        console.log('- %s', label.name);
      }
    }
  });
}

function listThreads(auth) {
  var mongoose = require('mongoose');
  mongoose.Promise = require('bluebird');

  var message
  //only focusing on nordstrom , 'VictoriasSecret@e1.victoriassecret.com','help@walmart.com', 'BestBuyInfo@emailinfo.bestbuy.com'
  var retailers = ['contact@em.nordstrom.com']
  var key_words = '{subject:order subject:reciept subject:confirmation subject:purchase}'
  query = 'in: anywhere,' + retailers +','+ key_words
  console.log(query)
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
      console.log(threads.length)
      
      for (var i = 0; i < threads.length; i++) {
        var thread = threads[i];

        console.log(thread)
        console.log('- %s', thread.id);
        gmail.users.messages.get({
          auth: auth,
          userId: 'me',
          id: thread.id,
          format: 'raw'
        }, function(err, response2) {
          if (err) {

            console.log('The API returned an error: ' + err);
            return;
          }

          var b = new Buffer(response2['raw'], 'base64')
          
          message =b.toString();
          raw_message = response2['raw']
          
          const email_thread = new Message({
            userid: 'user_id',
            email: 'crystal.wesnoski@gmail.com',
            thread_id: thread.id,
            encoded_message: raw_message},
            { unique: true }
          );

        
          email_thread.save((err) => {
            if (err) {return next(err);}
            console.log('saved thread '+thread.id)
          });

          }
        );
      }
    }
  });


}
