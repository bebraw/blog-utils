#!/usr/bin/env node

'use strict';

var path = require('path');
var qs = require('querystring');

var async = require('async');
var lodash = require('lodash');

var prop = lodash.property;

var zip = require('annozip');

var Twitter = require('simple-twitter');

if (require.main === module) {
    main();
} else {
    module.exports = fetchTweetUrls;
}

function main() {
    var config = process.argv[2];
    var date = process.argv[3];

    if(!config) {
        return console.error('Missing config!');
    }

    if(!date) {
        return console.error('Missing date!');
    }

    config = require(path.resolve(config));

    fetchTweetUrls({
        config: config,
        date: date
    }, function(err, d) {
        if(err) {
            return console.error(err);
        }

        console.log(JSON.stringify(d, null, 4));
    });
}

function fetchTweetUrls(options, cb) {
    var config = options.config;
    var date = options.date;

    getTweets({
        client: connect(config.auth),
        user: config.user,
        date: new Date(date)
    }, cb);
}

function connect(config) {
    return new Twitter(config.key, config.secret, config.token, config.tokenSecret);
}

function getTweets(o, cb) {
    var result = [];
    var maxId, terminate;

    async.doUntil(function(cb) {
        getStatuses({
            client: o.client,
            user: o.user,
            maxId: maxId
        }, function(err, statuses) {
            if(err) {
                return cb(err);
            }

            var newerThanDate = statuses.filter(function(v) {
                return v.date >= o.date;
            });

            result = result.concat(newerThanDate);

            if((newerThanDate.length < statuses.length) || !statuses.length) {
                terminate = true;
            }
            else {
                maxId = statuses.slice(-1)[0].id;
            }

            cb();
        });
    }, function() {
        return terminate;
    }, function(err) {
        if(err) {
            return cb(err);
        }

        return cb(null, result);
    });
}

function getStatuses(o, cb) {
    var opts = {
        count: 100,
        'screen_name': o.user || '',
        'trim_user': true,
        'exclude_replies': true,
        'include_rts': true
    };

    if(o.maxId) {
        opts['max_id'] = o.maxId;
    }

    o.client.get('statuses/user_timeline', '?' + qs.stringify(opts), function(err, data) {
        if(err) {
            return cb(err);
        }

        data = JSON.parse(data);

        var parts = [
            data.map(prop('id')),
            data.map(prop('created_at')).map(toDate),
            data.map(prop('entities')).map(prop('urls')).map(lodash.head).map(prop('expanded_url'))
        ];
        cb(null, zip.apply(null, parts).map(
            o => o.filter(a => a)
        ).filter(
            lengthEquals(parts.length)
        ).map(function(v) {
            return {
                id: v[0],
                date: new Date(v[1]),
                url: v[2]
            };
        }));
    });
}

function lengthEquals(amt) {
    return function(arr) {
        return arr.length === amt;
    };
}

function toDate(str) {
    return new Date(str);
}
