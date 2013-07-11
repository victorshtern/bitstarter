#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var util = require('util');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://thawing-thicket-4522.herokuapp.com/";


var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var checkUrlHtml = function(htmlCode, checksFile) {
  $ = cheerio.load(htmlCode);
  var checks = loadChecks(checksFile).sort();
  var out = {};
  for (var i in checks) {
    var present = $(checks[i]).length > 0;
    out[checks[i]] = present;
  }
//  console.log("processed checks in checkUrlHtml: ", out);
  return out;
 }

var assertValidUrl = function(data,status) {
  if (data instanceof Error) {
    console.log("Error: ",status.message);
    process.exit(1);  }
  else if (status.statusCode != 200) {
    console.log("Bad URL; code ",status.statusCode);
    process.exit(1); }
  else {
    return true; }
}

var processHtml = function(data,status) {
  if (assertValidUrl(data,status)) {
    var checkJson = checkUrlHtml(data,program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);  }
}

if(require.main == module) {
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
//        .option('-u,--url','Path to url','http://thawing-thicket-4522.herokuapp.com/') 
        .option('-u,--url','Path to URL',clone(assertValidUrl),URL_DEFAULT)
        .parse(process.argv);
    if (program.url) {
//       console.log("Program URL: ",program.url);
       rest.get(program.url).on('complete',processHtml); }
    else {
       var checkJson = checkHtmlFile(program.file, program.checks);
       var outJson = JSON.stringify(checkJson, null, 4);
       console.log(outJson);
       exports.checkHtmlFile = checkHtmlFile; }
}
