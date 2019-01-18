#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

var { groupBy } = require('lodash')
var titleCase = require('title-case');

main();

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        generateList(JSON.parse(data));
    });
}

function generateList(data) {
    var entries = Object.entries(groupBy(data, data => data.category))

    console.log(entries.map(([category, items]) => {
        return `
## ${titleCase(category)}

${items.map(item => `* [${item.title}](${item.url}) ${resolveDescription(item.description)}`).join('\n')}`
    }).join('\n'))
}

function resolveDescription(description) {
    return description ? `- ${description}` : ''
}
