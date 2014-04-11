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
    var source = '<ul>\n{{#items}}<li><a href="{{url}}">{{title}}</a></li>\n{{/items}}</ul>';
    var template = Handlebars.compile(source);

    console.log(template({
        items: data
    }));
}
