#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();
var url = require('url');

if (require.main === module) {
    main();
} else {
    module.exports = stripUrlParameters;
}

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        data = JSON.parse(data);

        stripUrlParameters(JSON.parse(data), function(err, d) {
            if(err) {
                return console.error(err);
            }

            console.log(JSON.stringify(data, null, 4));
        });
    });
}

function stripUrlParameters(data, cb) {
    cb(null, data.map(function(v) {
        if(v) {
            var parsed = url.parse(v.url);

            if(parsed.host !== 'www.youtube.com') {
                v.url = v.url.split('?')[0];
            }
        }

        return v;
    }));
}
