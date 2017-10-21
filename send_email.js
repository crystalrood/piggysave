// ------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------- //

// SCRIPT OVERVIEW
// script is intended to 
// 1) get list of items where status = 'need_to_contact'
// 2) for each item in the list, 
//    a. Find the associated user in the Users DB
//    b. Draft email 
//    c. Send email using Google API
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
    

/**
 * Send Message.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} email RFC 5322 formatted String.
 * @param  {Function} callback Function to call when the request is complete.
 */
function sendMessage(userId, email, callback) {
  // Using the js-base64 library for encoding:
  // https://www.npmjs.com/package/js-base64
  var base64EncodedEmail = Base64.encodeURI(email);
  var request = gapi.client.gmail.users.messages.send({
    'userId': userId,
    'resource': {
      'raw': base64EncodedEmail
    }
  });
  request.execute(callback);
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
  var query = Order_info_item_scrape.find({"status": "need_to_contact"});



  var query2 = Order_info_item_scrape.aggregate([{
  $lookup: {
    from: "users",
    localField: "email",
    foreignField: "email",
    as: "emails_match"
  }
  },
      { "$unwind": "$emails_match" },

  {
      $match: { $and: [{"emails_match._id": {$ne:null} }, {status: "need_to_contact"}]
        },
     }])   

  for (var k in envConfig) {
    process.env[k] = envConfig[k]
  }


  var google = require('googleapis');
  var OAuth2 = google.auth.OAuth2;
  var oauth2Client = new OAuth2(
    process.env.GOOGLE_ID,
    process.env.GOOGLE_SECRET,
    process.env.GOOGLE_URIS
    //need to comment above line out if running locally
  );

  var gmail = google.gmail({
    version: 'v1',
    auth: oauth2Client
  });

  // execute the query at a later time
  query2.exec(function (err, items) {
    if (err) return handleError(err);

    if (items.length == 0) {
      console.log('no items found that match critera');
    } else {
      for (var i = 0; i < items.length; i++) {

        var item = items[i]
        
        async.waterfall([

        function(callback) {

  
         
          console.log(item)
          var email_lines = [];

          var from = 'From: ' + item.email
          var to = 'To: crystal.rood.1@gmail.com'
          var subject = 'Asking for a price adjustment on #' + item.order_num
          var line1 = '<br></br> <br></br> On '+ item.date_placed+ ' I bought ' + item.item_name
          var line2 = ' and I see now that the price has dropped by $' + Number((item.price_difference).toFixed(2))
          var line3 = '. I am looking forward to getting money back on my purchase.'
          var line4 = '<br></br><br>Here is my order number #' + item.order_num + ' and the lower price on ' + item.item_name + '</br>'
          var line5 = '<br></br><br>' + item.link_to_product + '</br>'
          var line6 = '<br></br><br>I look forward to hearing from you!</br><br></br><br></br> Thanks!'

          email_lines.push(from);
          email_lines.push(to);
          email_lines.push('Content-type: text/html;charset=iso-8859-1');
          email_lines.push('MIME-Version: 1.0');
          email_lines.push("Subject: "+ subject);
          email_lines.push("");
          email_lines.push("Hello,");
          email_lines.push(line1 + line2 + line3 + line4 + line5 + line6);

          var email =email_lines.join("\r\n").trim();

          var base64EncodedEmail = new Buffer(email).toString('base64');

          base64EncodedEmail = base64EncodedEmail.replace(/\+/g, '-').replace(/\//g, '_')

          if (item.emails_match.tokens[0].accessToken) {
                  //setting oauth2Client credentials if user has a token set up
                  oauth2Client.setCredentials({
                  access_token: item.emails_match.tokens[0].accessToken,
                  refresh_token: item.emails_match.refresh_token[0].refreshToken
                });
          }                  
          var request = gmail.users.messages.send({
               auth: oauth2Client,
               userId: item.email,
             'resource': {
               'raw': base64EncodedEmail
              }
          }, callback(null, 'next1'));

        },
        function(arg1, callback) {
          //opening a pythong script to save to mongodb
          var PythonShell = require('python-shell');
          var path = process.cwd()+'/public/test_scripts/'
          var pyshell = new PythonShell('updating_status_mongo.py',{scriptPath: path, pythonOptions: ['-u']});

          //this is how you send info to a python script :D
          pyshell.send(JSON.stringify([item.order_num, item.item_name]));

          pyshell.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            console.log(message);

          });

          // end the input stream and allow the process to exit

          pyshell.end(function (err) {
            if (err) throw err;
            console.log('finished initial');
          });

        },
 
        
      ])//end of async waterfall
      } //end for loop
    }
      
  }) //execute query end

  console.log('hello ending')
  mongoose.connection.close()

}




sayHello();

