#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

var async = require('async');
var reachableUrl = require('reachable-url')

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
    reachableUrl(d.url).then(({ url }) => {
        d.url = url

        cb(null, d)
    }).catch(err => {
        console.error(err)

        cb();
    })
}

function id(a) {return a;}
