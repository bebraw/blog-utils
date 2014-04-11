#!/usr/bin/env node

'use strict';

var path = require('path');
var qs = require('querystring');

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

    if(!config) {
        return console.error('Missing config!');
    }

    // TODO: parse date
    config = require(path.resolve(config));

    var twitter = connect(config.auth);

    twitter.get('statuses/user_timeline', '?' + qs.stringify({
        count: 200,
        'screen_name': config.user || '',
        'trim_user': true,
        'exclude_replies': true,
        'include_rts': true
    }), function(err, data) {
        if(err) {
            return console.error(err);
        }

        data = JSON.parse(data);

        var parts = [
            data.map(prop('id')),
            data.map(prop('created_at')).map(toDate),
            data.map(prop('entities')).map(prop('urls')).map(first).map(prop('expanded_url'))
        ];
        var result = zip.apply(null, parts).map(filter.bind(null, id)).filter(lengthEquals(parts.length)).map(function(v) {
            return {
                id: v[0],
                date: v[1],
                url: v[2]
            };
        });

        // TODO: fetch tweets till given date is matched (use max_id)
        // https://dev.twitter.com/docs/api/1.1/get/statuses/user_timeline

        console.log(JSON.stringify(result, null, 4));
    });
}

function connect(config) {
    return new Twitter(config.key, config.secret, config.token, config.tokenSecret);
}

function lengthEquals(amt) {
    return function(arr) {
        return arr.length === amt;
    };
}

function toDate(str) {
    return new Date(str);
}
