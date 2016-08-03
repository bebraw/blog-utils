#!/usr/bin/env node
// Usage: ./fetch.js --config <config file> --date <date> > data.json
// Equivalent to fetch/tweet_urls.js <config> 'July 14, 2016' | resolve/urls.js | strip/url_parameters.js | fetch/titles.js > data.json
var async = require('async');
const argv = require('minimist')(process.argv.slice(2));

var fetchTitles = require('./fetch/titles');
var fetchTweetUrls = require('./fetch/tweet_urls');
var resolveUrls = require('./resolve/urls');
var stripUrlParameters = require('./strip/url_parameters');

main(argv);

function main(options) {
  if(!options.config) {
    return console.error('Missing config');
  }
  if(!options.date) {
    return console.error('Missing date');
  }

  fetch({
    config: require(options.config),
    date: options.date
  }, function(err, output) {
    if(err) {
      return console.error(err);
    }

    console.log(JSON.stringify(output, null, 4));
    process.exit();
  });
}

function fetch(options, cb) {
  async.waterfall([
    fetchTweetUrls.bind(null, options),
    resolveUrls,
    stripUrlParameters,
    fetchTitles
  ], cb);
}
