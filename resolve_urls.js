#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

var async = require('async');
var request = require('request');


main();

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        resolveUrls(JSON.parse(data));
    });
}

function resolveUrls(urls) {
    async.mapLimit(urls, 4, resolveUrl, function(err, d) {
        if(err) {
            return console.error(err);
        }

        console.log(JSON.stringify(d, null, 4));
    });
}

function resolveUrl(d, cb) {
    request.get(d.url, {
        rejectUnauthorized: false
    }, function(err, res) {
        if(err) {
            console.error(d.url, err);

            return cb();
        }

        d.url = res.request.uri.href;

        cb(null, d);
    });
}
