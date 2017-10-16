#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const fetch = require("./fetch");

const dir = path.join(__dirname, "./jsters");
fs.readdir(dir, (err, list) => {
  const files = list.map(file => {
    const filePath = path.join(dir, file);

    return {
      file,
      filePath: filePath,
      stats: fs.statSync(filePath) // mtime/ctime
    };
  });

  // Sort to find the last. In-place sort :(
  files.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

  const newest = files[0];
  const jsterNumber = parseInt(
    newest.file
      .split("jster")
      .filter(a => a)[0]
      .split(".")[0],
    10
  );
  const parseFrom = new Date();
  parseFrom.setDate(parseFrom.getDate() - 17);

  fetch(
    {
      config: "./jster_config.js",
      date: parseFrom
    },
    (err, output) => {
      if (err) {
        return console.error('Failed to fetch a new jster dump');
      }

      fs.writeFileSync(
        path.join(dir, `jster${jsterNumber + 1}.json`),
        JSON.stringify(output, null, 4)
      );
      process.exit();
    }
  );
});
