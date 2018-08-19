#!/usr/bin/env node
// Usage: ./fetch.js --config <config file> --date <date> > data.json
// Equivalent to fetch/tweet_urls.js <config> 'July 14, 2016' | resolve/urls.js | strip/url_parameters.js | fetch/titles.js > data.json
const path = require('path');
const async = require('async');

const fetchTitles = require('./fetch/titles');
const fetchTweetUrls = require('./fetch/tweet_urls');
const resolveUrls = require('./resolve/urls');
const stripUrlParameters = require('./strip/url_parameters');

if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2));

  main(argv);
} else {
  module.exports = main;
}

function main(options, cb) {
  if(!options.config) {
    return console.error('Missing config');
  }
  if(!options.date) {
    return console.error('Missing date');
  }

  fetch({
    config: require(path.resolve(options.config)),
    date: options.date
  }, function(err, output) {
    if(err) {
      if (cb) {
        return cb(err);
      }

      return console.error(err);
    }

    if (cb) {
      cb(null, output);
    } else {
      console.log(JSON.stringify(output, null, 4));
      process.exit();
    }
  });
}

function fetch(options, cb) {
  async.waterfall([
    fetchTweetUrls.bind(null, options),
    resolveUrls,
    stripUrlParameters,
    fetchTitles,
    attachCategories
  ], cb);
}

function attachCategories(urls, cb) {
  cb(null, urls.map(url => ({
    ...url,
    category: ''
  })))
}
