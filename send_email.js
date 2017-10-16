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
    console.log(items)

    if (items.length == 0) {
      console.log('no items found that match critera');
    } else {
      for (var i = 0; i < items.length; i++) {
        var thread = items[i];
        //console.log(thread.email)

      


      }
    }
      
  }) //execute query end

  console.log('hello ending')
  mongoose.connection.close()

}




sayHello();

