const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath, callback);
    } else if (f.endsWith(".ejs") || f.endsWith(".html")) {
      callback(dirPath);
    }
  });
}

walk(path.join(__dirname, "views"), (filePath) => {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;

  // Remove topMenu includes (handling multiple formats and newlines inside EJS tags)
  content = content.replace(
    /<%-?\s*include\(['"`]\.\/partials\/topMenu\.ejs['"`][\s\S]*?%>\s*/g,
    ""
  );

  // Remove the old topMenu script tag from footer
  content = content.replace(/<script src="\/js\/topMenu\.js[^>]*><\/script>\s*/g, "");

  // Remove mt-16 class globally (accounting for surrounding spaces/quotes)
  content = content.replace(/ mt-16 /g, " ");
  content = content.replace(/mt-16 /g, "");
  content = content.replace(/ mt-16"/g, '"');
  content = content.replace(/mt-16"/g, '"');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log("Cleaned:", filePath);
  }
});
