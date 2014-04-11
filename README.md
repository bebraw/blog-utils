# blog-utils

Blog utils for fetching tweets, composing posts etc.

## get_tweet_urls

The tool fetches tweets associated to configuration account (possible to extend later). Still missing fetch since date.

Usage: `./get_tweet_urls.js twitter_config.js > tweets.json`.

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

TODO. This should resolve urls to their full form. Idea: pipe and use request `res.request.uri.href`.

## strip_url_parameters

TODO: This should strip ? parts (url.resolve) out of list of given urls (pipe).

## License

MIT.
