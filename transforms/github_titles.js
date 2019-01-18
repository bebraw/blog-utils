#!/usr/bin/env node

'use strict';

var stdin = process.openStdin();

if (require.main === module) {
    main();
}
else {
    module.exports = transformGitHubTitles
}

function main() {
    stdin.setEncoding('utf8');
    stdin.on('data', function(data) {
        console.log(JSON.stringify(transformGitHubTitles(JSON.parse(data)), null, 4));
    });
}

function transformGitHubTitles(data) {
    return data.map(o => ({ ...o, title: transformTitle(o.url, o.title)}))
}

function transformTitle(url, title) {
    if (url.startsWith('https://github.com')) {
        return url.split('https://github.com/')[1]
    }

    return title
}
