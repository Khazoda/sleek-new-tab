const fs = require("fs");

const html = fs.readFileSync("extension/index.html", "utf8");
const processed = html.replace(
  /<!-- BUILD:SCRIPTS -->[\s\S]*?<!-- \/BUILD:SCRIPTS -->/,
  '<script src="./bundle.min.js" defer></script>'
);

fs.writeFileSync("extension/dist/index.html", processed);
