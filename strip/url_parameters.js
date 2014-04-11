#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();
var url = require('url');


main();

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        data = JSON.parse(data);

        data = data.map(function(v) {
            if(v) {
                var parsed = url.parse(v.url);

                if(parsed.host !== 'www.youtube.com') {
                    v.url = v.url.split('?')[0];
                }
            }

            return v;
        });

        console.log(JSON.stringify(data, null, 4));
    });
}
