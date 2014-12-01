#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

var Handlebars = require('handlebars');

main();

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        generateList(JSON.parse(data));
    });
}

function generateList(data) {
    var source = '{{#items}}* [{{{title}}}]({{url}})\n{{/items}}';
    var template = Handlebars.compile(source);

    console.log(template({
        items: data
    }));
}
