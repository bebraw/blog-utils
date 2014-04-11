#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

var async = require('async');


main();

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        data = JSON.parse(data);

        data = data.map(function(v) {
            if(v) {
                v.url = v.url.split('?')[0];
            }

            return v;
        });

        console.log(JSON.stringify(data, null, 4));
    });
}

function stripUrlParameters(urls) {
    async.map(urls, function(d, cb) {
        console.log()

        d.url = d.url.split('?')[0];

        cb(null, d);
    }, function(err, d) {
        if(err) {
            return console.error(err);
        }

        console.log(JSON.stringify(d, null, 4));
    });
}
