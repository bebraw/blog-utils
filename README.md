# blog-utils

Blog utils for fetching tweets, composing posts etc.

## get_tweet_urls

The tool fetches tweets based on given user and date.

Usage: `./get_tweet_urls.js twitter_config.js date > tweets.json`

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

## resolve_urls

The tool resolves Twitter urls to their full form (ie. strips bitly and such).

Usage: `/resolve_urls.js < tweets.json > resolved_tweets.json`

## strip_url_parameters

The tool strips url parameters.

Usage: `./strip_url_parameters.js < resolved_tweets.json > stripped_tweets.json`

## License

MIT.
