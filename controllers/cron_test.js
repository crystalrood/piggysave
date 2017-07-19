//cron job to run python modules

var CronJob = require('cron').CronJob;
const async = require('async');
var PythonShell = require('python-shell');

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
/*

new CronJob('* * * * * *', function() {
  console.log('peanuts')
  runPythonScript()

}, null, true, 'America/Los_Angeles');
*/