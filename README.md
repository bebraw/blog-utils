# blog-utils

Blog utils for fetching tweets, composing posts etc.

## Fetchers

### tweet_urls

The tool fetches tweets based on given user and date.

Usage: `./fetch/tweet_urls.js twitter_config.js date > tweets.json`

Configuration:

```
module.exports = {
    user: 'twitter user', // optional
    auth: {
        key: 'get via twitter dev site',
        secret: 'get via twitter dev site',
        token: 'get via twitter dev site',
        tokenSecret: 'get via twitter dev site'
    }
};
```

### titles

The tool fetches url titles.

Usage: `./fetch/titles.js < stripped_tweets.json > titled_tweets.json`

## Resolvers

### urls

The tool resolves Twitter urls to their full form (ie. strips bitly and such).

Usage: `./resolve/urls.js < tweets.json > resolved_tweets.json`

## Strippers

### url_parameters

The tool strips url parameters.

Usage: `./strip/url_parameters.js < resolved_tweets.json > stripped_tweets.json`

## Generators

### list

The tool generates a HTML list.

Usage: `generate/list.js < titled_tweets.json > list.html`

## License

MIT.
