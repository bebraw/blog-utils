#!/usr/bin/env node

'use strict';

var path = require('path');
var qs = require('querystring');

var async = require('async');
var fp = require('annofp');
var first = fp.first;
var filter = fp.filter;
var id = fp.id;
var prop = fp.prop;
var zip = require('annozip');

var Twitter = require('simple-twitter');


main();

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

    getTweets({
        client: connect(config.auth),
        user: config.user,
        date: new Date(date)
    }, function(err, tweets) {
        if(err) {
            return console.error(err);
        }

        console.log(JSON.stringify(tweets, null, 4));
    });
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
            data.map(prop('entities')).map(prop('urls')).map(first).map(prop('expanded_url'))
        ];
        cb(null, zip.apply(null, parts).map(filter.bind(null, id)).filter(lengthEquals(parts.length)).map(function(v) {
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
