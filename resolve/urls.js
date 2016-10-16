#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

var async = require('async');
var request = require('request');

if (require.main === module) {
    main();
} else {
    module.exports = resolveUrls;
}

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(err, data) {
        if(err) {
            return console.error(err);
        }

        console.log(JSON.stringify(resolveUrls(JSON.parse(data)), null, 4));
    });
}

function resolveUrls(urls, cb) {
    async.mapLimit(urls, 20, resolveUrl, function(err, d) {
        if(err) {
            return cb(err);
        }

        cb(null, d.filter(id));
    });
}

function resolveUrl(d, cb) {
    request.get(d.url, {
        rejectUnauthorized: false,
        pool: {
            maxSockets: 1000
        },
        jar: true
    }, function(err, res) {
        if(err) {
            console.error(d.url, err);

            return cb();
        }

        d.url = res.request.uri.href;

        cb(null, d);
    });
}

function id(a) {return a;}
