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

### html_list

The tool generates a HTML list.

Usage: `generate/html_list.js < titled_tweets.json > list.html`

### md_list

The tool generates a Markdown list.

Usage: `generate/md_list.js < titled_tweets.json > list.md`

## JSter

Create the next JSter draft from sent Buffer posts:

```bash
npm run jster:new
```

The command reads `BUFFER_SECRET` or `BUFFER_API_KEY` from `.env`, detects the
latest local `jsterNNN`, finds the matching `Check JSter #NNN` Buffer post, and
writes the next `jsters/jsterNNN.json` and `jsters/jsterNNN.md`.

After editing categories or descriptions in the JSON, run the same command again
to sort entries by category and regenerate Markdown. If the Markdown file already
has intro text before the first `##` heading, the command preserves it.

Useful options:

```bash
npm run jster:new -- --dry-run
npm run jster:new -- --previous 255 --number 256
npm run jster:new -- --organization <id> --channel <id>
```

## Example

The tools above may be combined using piping. See below:

```bash
fetch/tweet_urls.js twitter_config.js "April 1, 2014 01:00:00" | resolve/urls.js | strip/url_parameters.js | fetch/titles.js > data.json
```

## License

MIT.
