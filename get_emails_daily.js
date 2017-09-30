// ------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------- //

// SCRIPT OVERVIEW
// script is intended to 
// 1) get a list of all users
// 2) for each user in the list, scrape their email
// 3) do the stuff that i did initially in order.js


// ------------------------------------------------------------------------------- //
// getting all the variables in place
// ------------------------------------------------------------------------------- //
const async = require('async');
const Order_info_item_scrape = require('./models/Order_info_item_scrape.js');
const Message = require('./models/Message.js');
const passport = require('passport');
var PythonShell = require('python-shell');
var mongoose = require('mongoose');
var fs = require('fs');
const User = require('./models/User');
mongoose.Promise = require('bluebird');

require('dotenv').config()
const dotenv = require('dotenv')
const envConfig = dotenv.parse(fs.readFileSync('.env.example'))


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


// ------------------------------------------------------------------------------- //
//sub function to get message from gmail api
// ------------------------------------------------------------------------------- //
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



function get_pretty_date(value){
  var start_date = new Date(value)
  var s_year = start_date.getFullYear();
  var s_month = start_date.getMonth() + 1;
  if(s_month <= 9)
      s_month = '0'+s_month;
  var s_day= start_date.getDate();
  if(s_day <= 9)
      s_day = '0'+s_day;

  var s_prettyDate = s_year+ '-'+ s_month +'-'+ s_day 
  return s_prettyDate
}
    

// ------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------- //


function sayHello() {
  

  //Import the mongoose module
  var mongoose = require('mongoose');
  var bodyParser = require('body-parser')
  // create application/json parser
  var jsonParser = bodyParser.json()
 
  // create application/x-www-form-urlencoded parser
  var urlencodedParser = bodyParser.urlencoded({ extended: false })

  //Set up default mongoose connection
  var mongoDB = 'mongodb://heroku_4jtg3rvf:r9nq5ealpnfrlda5la4fj8r192@ds161503.mlab.com:61503/heroku_4jtg3rvf'
  //var mongoDB = 'mongodb://localhost:27017/test';

  mongoose.connect(mongoDB, {
    useMongoClient: true
  });



  //Get the default connection
  // mongoose.createConnection(uri, { replset: { poolSize: 4 }});
  var db = mongoose.connection;

  //Bind connection to error event (to get notification of connection errors)
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));

  // find all users
  var query = User.find();

  for (var k in envConfig) {
    process.env[k] = envConfig[k]
  }


  var google = require('googleapis');
  var OAuth2 = google.auth.OAuth2;
  var oauth2Client = new OAuth2(
    process.env.GOOGLE_ID,
    process.env.GOOGLE_SECRET,
    //process.env.GOOGLE_URIS
  );

  var gmail = google.gmail({
    version: 'v1',
    auth: oauth2Client
  });

  // execute the query at a later time
  query.exec(function (err, users) {
    if (err) return handleError(err);

    //ensuring that users were pulled from the database
    if (users.length >= 1){
      users.forEach(function(user, index) {


        //getting today's date
        var today_date = new Date()
        today_date = get_pretty_date(today_date)

        console.log(user.last_scheduled_scrape)
        //comparing today to the last day the scraper was run
        if (user.last_scheduled_scrape <= today_date) {
          console.log('user email:  ' + user.email)

          async.waterfall([

            function(callback) {

              console.log()
              console.log(process.env.GOOGLE_ID)
              if (user.tokens[0].accessToken) {
                  //setting oauth2Client credentials if user has a token set up
                  oauth2Client.setCredentials({
                  access_token: user.tokens[0].accessToken,
                  refresh_token: user.refresh_token[0].refreshToken
                });

                console.log(user.email)

                var retailers = ['contact@em.nordstrom.com']
                var key_words = '{subject:order subject:reciept subject:in process subject:confirmation subject:purchase}'
                var lookback = 'after:2017/09/10'
                //newer_than:2d
                query = 'in: anywhere,' + retailers +','+ key_words + ',' + lookback

                gmail.users.threads.list({
                  auth: oauth2Client,
                  userId: user.email,
                  q: query
                }, function(err, response) {
                  if (err) {
                    //should probably log error on user log
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
                  
                    //getMessage(i , req.user.email, thread)
                    gmail.users.messages.get({
                      auth: oauth2Client,
                      userId: user.email,
                      id: thread.id,
                      format: 'raw'
                    },
                      function(err, response2) {
                        if (err) {
                          console.log('The API returned an error: ' + err);
                          return;
                        }
                        
                        var date = new Date().getTime()

                        //opening a pythong script to save to MongoDB
                        var PythonShell = require('python-shell');
                        var path = process.cwd()+'/public/test_scripts/'
                        var pyshell = new PythonShell('saving_message_to_mongo.py',{scriptPath: path, pythonOptions: ['-u']});

                        //this is how you send info to a python script :D
                        pyshell.send(JSON.stringify([user.email, date, thread.id, response2['raw'],'need to scrape']));

                        pyshell.on('message', function (message) {
                          // received a message sent from the Python script (a simple "print" statement)
                          console.log(message);

                        });

                        // end the input stream and allow the process to exit

                        pyshell.end(function (err) {
                          if (err) throw err;
                          console.log('finished initial');
                        });

                        j++;
                       
                        console.log(j)
                        if (j==threads.length){
                          callback(null, 'next1');
                        }
                     })
                    }
                  }
                });
                  
              }

              //else{
              //  callback(null, 'next1');
              //}

            },


            function(arg1, callback) {
              //in this subfunction i want to call the python scraper :D

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


            },

            function(arg1, callback) {
              //in this subfunction i want to call the python scraper :D


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


            },

            function(arg1, callback) {

                  User.update(
                    {'email': user.email }
                    ,{$set:{'last_scheduled_scrape': today_date }}
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
            console.log('result')
        });
        }
      }); //going through each user end
    }; //checking user length end
  }) //execute query end

  console.log('hello ending')
  mongoose.connection.close()

}




sayHello();

