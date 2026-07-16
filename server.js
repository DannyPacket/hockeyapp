// Local development server for packeyapp
// Serves static files + emulates the Netlify function at /.netlify/functions/*
// Run:  node server.js   (or double-click start-local.bat)
// Then open:  http://localhost:3000

const http = require("http");
const fs = require("fs");
const path = require("path");

const FUNCTIONS = {
  "fetch-sheet": require("./netlify/functions/fetch-sheet.js").handler,
  "fetch-games": require("./netlify/functions/fetch-games.js").handler,
  "espn-game": require("./netlify/functions/espn-game.js").handler,
};

const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store", // prevent stale JS/HTML in dev
    });
    res.end(data);
  });
}

async function handleFunction(handler, res, params) {
  const result = await handler({ queryStringParameters: params });
  res.writeHead(result.statusCode, { "Content-Type": "application/json" });
  res.end(result.body);
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;
  const params = Object.fromEntries(parsed.searchParams);

  const fnMatch = pathname.match(/^\/\.netlify\/functions\/([\w-]+)$/);
  if (fnMatch && FUNCTIONS[fnMatch[1]]) return handleFunction(FUNCTIONS[fnMatch[1]], res, params);

  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end("Forbidden"); return; }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`\nPackey running at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.\n");
});
