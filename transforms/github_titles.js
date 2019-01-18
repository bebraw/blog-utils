#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

main();

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        transformGitHubTitles(JSON.parse(data));
    });
}

function transformGitHubTitles(data) {
    console.log(JSON.stringify(data.map(o => ({ ...o, title: transformTitle(o.url, o.title)})), null, 4))
}

function transformTitle(url, title) {
    if (url.startsWith('https://github.com')) {
        return url.split('https://github.com/')[1]
    }

    return title
}
