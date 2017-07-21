//cron job to run python modules

var CronJob = require('cron').CronJob;
const async = require('async');
var PythonShell = require('python-shell');
const Message = require('../models/Message.js');
const User = require('../models/User.js');


const EventEmitter = require('events');


function runPythonScript() {

  var PythonShell = require('python-shell');

  var pyshell = new PythonShell('test.py',{scriptPath:"/Users/crystalm/desktop/piggie/", pythonOptions: ['-u']});

  pyshell.on('message', function (message) {
    // received a message sent from the Python script (a simple "print" statement)
    console.log(message);

  });

  // end the input stream and allow the process to exit
  pyshell.end(function (err) {
    if (err) throw err;
    console.log('finished');
  });




}

function runPythonScript2() {

  var PythonShell = require('python-shell');

  var pyshell = new PythonShell('test_scrape_nordstrom.py',{scriptPath:"/Users/crystalm/desktop/piggie/", pythonOptions: ['-u']});

  pyshell.on('message', function (message) {
    // received a message sent from the Python script (a simple "print" statement)
    console.log(message);

  });

  // end the input stream and allow the process to exit
  pyshell.end(function (err) {
    if (err) throw err;
    console.log('finished');
  });

}


function getemails(){

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



  //sub function to get message from gmail api
   function getMessage(i, auth, thread_id, email, callback) {
     gmail.users.messages.get({
       auth:auth,
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
             encoded_message: response2['raw'],
             status: 'need to scrape'
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

   //pulling user information and sending each user through the script
   User.find((err, user_info) => {
     //console.log(user_info)

     if (user_info.length >= 1){
        //iterating through each document and adding it to the
        //secondary collection
        user_info.forEach(function(shft, index) {
          var email = shft.email
          console.log(shft.email)

          var date = new Date()

          var dd   = date.getDate()-1;
          var mm   = date.getMonth()+1; //January is 0!
          var yyyy = date.getFullYear();

          if(dd<10)  { dd='0'+dd }
          if(mm<10)  { mm='0'+mm }

          var formated_date = (yyyy) + "/" + (mm) + "/" + (dd);


          var message
          //only focusing on nordstrom , 'VictoriasSecret@e1.victoriassecret.com','help@walmart.com', 'BestBuyInfo@emailinfo.bestbuy.com'
          var retailers = ['contact@em.nordstrom.com']
          var key_words = '{subject:order subject:reciept subject:confirmation subject:purchase}'
          var date_filter = 'after:' + formated_date
          query = 'in: anywhere,' + retailers +','+ key_words + ',' + date_filter
          //console.log(query)
          var gmail = google.gmail('v1');
          gmail.users.threads.list({
            auth: auth,
            includeSpamTrash: true,
            userId: email,
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
                //console.log(thread)
                getMessage(i ,auth, thread, email)

              }
            }
          });
        });
      };
   });
  }
}



function newusercheck(){

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



  //sub function to get message from gmail api
   function getMessage(i, auth, thread_id, email, callback) {
     gmail.users.messages.get({
       auth:auth,
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
         console.log(thread_id.id)
         email_thread.save();

      }
    )

   }



  function listThreads(auth) {

   var mongoose = require('mongoose');
   mongoose.Promise = require('bluebird');

   //pulling user information and sending each user through the script to
   //pull emails and populate database with all emails
   User.find((err, user_info) => {

     //if i have users then do the following
     if (user_info.length >= 1){

        //go through each user and evalulate whether they are new or not
        user_info.forEach(function(shft, index) {
          var email = shft.email

          var date_created = Math.round((new Date(shft.createdAt)).getTime() / 1000)
          var currentUnixTime = Math.round((new Date()).getTime() / 1000)


          // logic here is that if the current time - the time account was created
          // minus 1 day is < 0, meaning that it was created within the last 24 hours
          // then go through then send them through the script to get all
          // relevent emails --> should eventually change this so it's a flag within
          // the user's account

          if (currentUnixTime-date_created-(60*60*24)<0 ){
            console.log('yes')

              var message
              //only focusing on nordstrom , 'VictoriasSecret@e1.victoriassecret.com','help@walmart.com', 'BestBuyInfo@emailinfo.bestbuy.com'
              var retailers = ['contact@em.nordstrom.com']
              var key_words = '{subject:order subject:reciept subject:confirmation subject:purchase}'
              query = 'in: anywhere,' + retailers +','+ key_words
              //console.log(query)
              var gmail = google.gmail('v1');
              gmail.users.threads.list({
                auth: auth,
                userId: email,
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

                    getMessage(i ,auth, thread, email)

                  }
                }
              });

          }


        });
      };
   });
  }
}


new CronJob('* * * * * *', function() {
  console.log('peanuts')
  //runPythonScript()
  getemails()
  //newusercheck()


}, null, true, 'America/Los_Angeles');
