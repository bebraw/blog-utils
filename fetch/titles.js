#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

var async = require('async');
var cheerio = require('cheerio');
var ent = require('ent');
var request = require('request');

if (require.main === module) {
    main();
} else {
    module.exports = fetchTitles;
}

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        fetchTitles(JSON.parse(data), function(err, d) {
            if(err) {
                return console.error(err);
            }

            console.log(JSON.stringify(d.filter(id), null, 4));
        });
    });
}

function fetchTitles(urls, cb) {
    async.mapLimit(urls, 10, fetchTitle, function(err, d) {
        if(err) {
            return cb(err);
        }

        cb(null, d.filter(id));
    });
}

function fetchTitle(d, cb) {
    if(!d) {
        return cb();
    }

    request.get(d.url, {
        rejectUnauthorized: false,
        pool: {
            maxSockets: 10
        },
        gzip: true,
        jar: true,
        timeout: 5000
    }, function(err, res, body) {
        if(err) {
            console.error(d.url, err);

            return cb();
        }

        var $ = cheerio.load(body);
        var text = $('title').text();

        d.title = clean(ent.decode(text)).split('\n').join('').replace(/\s{2,}/g, ' ').trim();

        // Attach empty descriptions too
        d.description = '';

        cb(null, d);
    }).on('error', (e) => {
        console.log(e);

        cb();
    }).end();
}

function clean(str) {
    return str.split('·')[0].
        split(' - ')[0].
        split(' — ')[0].
        split('|')[0].
        split('//')[0].
        split(' « ')[0].
        split(' » ')[0].
        split(' : ')[0].
        split(' ✩ ')[0].
        split(' ♥ ')[0];
}

function id(a) {return a;}
