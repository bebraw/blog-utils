#!/usr/bin/env node
"use strict";

var fs = require("fs");
var https = require("https");
var path = require("path");
var transformGitHubTitles = require("./transforms/github_titles");

var ROOT = __dirname;
var JSTERS_DIR = path.join(ROOT, "jsters");
var ENV_PATH = path.join(ROOT, ".env");
var BUFFER_API_URL = "https://api.buffer.com";
var DEFAULT_POST_LIMIT = 100;
var MAX_POSTS_TO_SCAN = 500;
var ANNOUNCEMENT_RE = /Check JSter #(\d+)/i;
var URL_RE = /(https?:\/\/\S+)\s*$/;

main().catch(function (err) {
  console.error(err.message || err);
  process.exit(1);
});

async function main() {
  var args = parseArgs(process.argv.slice(2));
  var token = args.token || readEnv(ENV_PATH).BUFFER_SECRET || readEnv(ENV_PATH).BUFFER_API_KEY;

  if (!token) {
    throw new Error("Missing BUFFER_SECRET or BUFFER_API_KEY in .env");
  }

  var account = await graphql(token, [
    "query Account {",
    "  account {",
    "    organizations { id name }",
    "  }",
    "}",
  ].join("\n"));

  var organizations = account.data.account.organizations || [];
  var organizationId = args.organization || (organizations[0] && organizations[0].id);

  if (!organizationId) {
    throw new Error("No Buffer organization found. Pass --organization <id>.");
  }

  var channelsResult = await graphql(token, [
    "query Channels($organizationId: OrganizationId!) {",
    "  channels(input: { organizationId: $organizationId }) {",
    "    id",
    "    name",
    "    displayName",
    "    service",
    "  }",
    "}",
  ].join("\n"), { organizationId: organizationId });

  var channels = channelsResult.data.channels || [];
  var channelId = args.channel || pickChannel(channels);

  if (!channelId) {
    throw new Error("No Buffer channel found. Pass --channel <id>.");
  }

  var localMax = args.number ? args.number - 1 : getLatestJsterNumber(JSTERS_DIR);
  var scannedPosts = await fetchSentPosts(token, organizationId, channelId, MAX_POSTS_TO_SCAN);
  var announcement = resolveAnnouncement(scannedPosts, localMax, args.previous);

  if (!announcement) {
    throw new Error("Could not find a Buffer post like \"Check JSter #" + localMax + "\".");
  }

  var previousNumber = announcement.number;
  var nextNumber = args.number || previousNumber + 1;
  var jsonPath = path.join(JSTERS_DIR, "jster" + nextNumber + ".json");
  var mdPath = path.join(JSTERS_DIR, "jster" + nextNumber + ".md");
  var existingEntries = readJsonIfExists(jsonPath);
  var fetchedEntries = scannedPosts
    .filter(function (post) {
      return isAfter(post.sentAt || post.dueAt || post.createdAt, announcement.date);
    })
    .filter(function (post) {
      return !ANNOUNCEMENT_RE.test(post.text);
    })
    .map(postToEntry)
    .filter(Boolean);
  var entries = mergeEntries(existingEntries, transformGitHubTitles(fetchedEntries));
  var sortedEntries = sortEntries(entries, existingEntries);
  var markdown = renderMarkdown(sortedEntries, readPreamble(mdPath));

  if (args.dryRun) {
    console.log(JSON.stringify(sortedEntries, null, 2));
    console.error("Would write " + jsonPath + " and " + mdPath);
    return;
  }

  fs.writeFileSync(jsonPath, JSON.stringify(sortedEntries, null, 2) + "\n");
  fs.writeFileSync(mdPath, markdown);

  console.log("Previous JSter: #" + previousNumber);
  console.log("Fetched posts: " + fetchedEntries.length);
  console.log("Wrote " + path.relative(ROOT, jsonPath));
  console.log("Wrote " + path.relative(ROOT, mdPath));
}

function parseArgs(argv) {
  var ret = {};

  for (var i = 0; i < argv.length; i += 1) {
    var arg = argv[i];

    if (arg === "--dry-run") {
      ret.dryRun = true;
    } else if (arg === "--token") {
      ret.token = argv[++i];
    } else if (arg === "--organization") {
      ret.organization = argv[++i];
    } else if (arg === "--channel") {
      ret.channel = argv[++i];
    } else if (arg === "--number") {
      ret.number = parsePositiveInteger(argv[++i], "--number");
    } else if (arg === "--previous") {
      ret.previous = parsePositiveInteger(argv[++i], "--previous");
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error("Unknown argument: " + arg);
    }
  }

  return ret;
}

function printHelp() {
  console.log([
    "Usage: ./fetch-new-jster.js [options]",
    "",
    "Fetch sent Buffer posts after the latest JSter announcement and render the next issue.",
    "",
    "Options:",
    "  --dry-run              Print JSON without writing files",
    "  --number <number>      Force the issue number to write",
    "  --previous <number>    Force the previous announced JSter number",
    "  --organization <id>    Force Buffer organization id",
    "  --channel <id>         Force Buffer channel id",
  ].join("\n"));
}

function parsePositiveInteger(value, name) {
  var number = parseInt(value, 10);

  if (!number || number < 1) {
    throw new Error(name + " must be a positive integer");
  }

  return number;
}

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).reduce(function (env, line) {
    var match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);

    if (match) {
      env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }

    return env;
  }, {});
}

function graphql(token, query, variables) {
  return postJson(BUFFER_API_URL, token, {
    query: query,
    variables: variables || {},
  }).then(function (result) {
    if (result.errors && result.errors.length) {
      throw new Error(result.errors.map(function (error) {
        return error.message;
      }).join("\n"));
    }

    return result;
  });
}

function postJson(url, token, body) {
  return new Promise(function (resolve, reject) {
    var payload = JSON.stringify(body);
    var request = https.request(url, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    }, function (response) {
      var chunks = "";

      response.setEncoding("utf8");
      response.on("data", function (chunk) {
        chunks += chunk;
      });
      response.on("end", function () {
        try {
          resolve(JSON.parse(chunks));
        } catch (err) {
          reject(new Error("Buffer returned invalid JSON: " + chunks));
        }
      });
    });

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

async function fetchSentPosts(token, organizationId, channelId, maxPosts) {
  var posts = [];
  var after = null;

  while (posts.length < maxPosts) {
    var result = await graphql(token, [
      "query Posts($organizationId: OrganizationId!, $channelIds: [ChannelId!], $after: String) {",
      "  posts(",
      "    first: " + DEFAULT_POST_LIMIT,
      "    after: $after",
      "    input: {",
      "      organizationId: $organizationId",
      "      filter: { status: [sent], channelIds: $channelIds }",
      "      sort: [{ field: createdAt, direction: desc }]",
      "    }",
      "  ) {",
      "    edges {",
      "      cursor",
      "      node {",
      "        id",
      "        text",
      "        createdAt",
      "        dueAt",
      "        sentAt",
      "      }",
      "    }",
      "    pageInfo { endCursor hasNextPage }",
      "  }",
      "}",
    ].join("\n"), {
      organizationId: organizationId,
      channelIds: [channelId],
      after: after,
    });
    var connection = result.data.posts;
    var pagePosts = connection.edges.map(function (edge) {
      return edge.node;
    });

    posts = posts.concat(pagePosts);

    if (!connection.pageInfo.hasNextPage || !pagePosts.length) {
      break;
    }

    after = connection.pageInfo.endCursor;
  }

  return posts.slice(0, maxPosts);
}

function pickChannel(channels) {
  var jster = channels.filter(function (channel) {
    return channel.name === "jsterlibs" || channel.displayName === "jsterlibs";
  })[0];

  return (jster || channels[0] || {}).id;
}

function getLatestJsterNumber(dir) {
  return fs.readdirSync(dir).reduce(function (latest, file) {
    var match = file.match(/^jster(\d+)\.(json|md)$/);

    if (!match) {
      return latest;
    }

    return Math.max(latest, parseInt(match[1], 10));
  }, 0);
}

function resolveAnnouncement(posts, localMax, forcedPrevious) {
  var announcements = posts.map(function (post) {
    var match = post.text.match(ANNOUNCEMENT_RE);

    if (!match) {
      return null;
    }

    return {
      number: parseInt(match[1], 10),
      date: post.sentAt || post.dueAt || post.createdAt,
      post: post,
    };
  }).filter(Boolean);

  if (forcedPrevious) {
    return announcements.filter(function (announcement) {
      return announcement.number === forcedPrevious;
    })[0];
  }

  return announcements.filter(function (announcement) {
    return announcement.number === localMax;
  })[0] || announcements.filter(function (announcement) {
    return announcement.number === localMax - 1;
  })[0] || announcements[0];
}

function isAfter(value, baseline) {
  return new Date(value).getTime() > new Date(baseline).getTime();
}

function postToEntry(post) {
  var match = post.text.match(URL_RE);

  if (!match) {
    return null;
  }

  return {
    title: post.text.slice(0, match.index).replace(/\s+/g, " ").trim(),
    url: match[1].replace(/[.,;:!?)]$/, ""),
    description: "",
    category: "",
  };
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function mergeEntries(existingEntries, fetchedEntries) {
  var existingByUrl = existingEntries.reduce(function (ret, entry) {
    ret[entry.url] = entry;

    return ret;
  }, {});

  return fetchedEntries.map(function (entry) {
    var existing = existingByUrl[entry.url];

    if (!existing) {
      return entry;
    }

    return {
      title: existing.title || entry.title,
      url: entry.url,
      description: existing.description || "",
      category: existing.category || "",
    };
  });
}

function sortEntries(entries, existingEntries) {
  var categoryOrder = getCategoryOrder(existingEntries);

  return entries.map(function (entry, index) {
    return {
      entry: entry,
      index: index,
    };
  }).sort(function (a, b) {
    var categoryComparison = compareCategory(a.entry.category, b.entry.category, categoryOrder);

    if (categoryComparison) {
      return categoryComparison;
    }

    return a.index - b.index;
  }).map(function (item) {
    return item.entry;
  });
}

function getCategoryOrder(entries) {
  return entries.reduce(function (order, entry) {
    var category = normalizeCategory(entry.category);

    if (category && order.indexOf(category) === -1) {
      order.push(category);
    }

    return order;
  }, []);
}

function compareCategory(a, b, categoryOrder) {
  var normalizedA = normalizeCategory(a);
  var normalizedB = normalizeCategory(b);
  var indexA = categoryIndex(normalizedA, categoryOrder);
  var indexB = categoryIndex(normalizedB, categoryOrder);

  if (indexA !== indexB) {
    return indexA - indexB;
  }

  return 0;
}

function categoryIndex(category, categoryOrder) {
  if (!category) {
    return Number.MAX_SAFE_INTEGER;
  }

  var index = categoryOrder.indexOf(category);

  return index === -1 ? Number.MAX_SAFE_INTEGER - 1 : index;
}

function normalizeCategory(category) {
  return (category || "").trim().toLowerCase();
}

function readPreamble(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  var markdown = fs.readFileSync(filePath, "utf8");
  var headingIndex = markdown.search(/^## /m);

  if (headingIndex === -1) {
    return markdown.trim() ? markdown.trim() + "\n\n" : "";
  }

  return markdown.slice(0, headingIndex).trim() ? markdown.slice(0, headingIndex).trim() + "\n\n" : "";
}

function renderMarkdown(entries, preamble) {
  var groups = entries.reduce(function (ret, entry) {
    var category = entry.category || "uncategorized";

    if (!ret[category]) {
      ret[category] = [];
    }

    ret[category].push(entry);

    return ret;
  }, {});
  var body = Object.keys(groups).map(function (category) {
    return [
      "## " + titleCase(category),
      "",
      groups[category].map(renderEntry).join("\n"),
    ].join("\n");
  }).join("\n\n");

  return preamble + body + "\n";
}

function renderEntry(entry) {
  return "- [" + entry.title + "](" + entry.url + ")" + (entry.description ? " - " + entry.description : "");
}

function titleCase(value) {
  return value.replace(/[-_]/g, " ").replace(/\w\S*/g, function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}
