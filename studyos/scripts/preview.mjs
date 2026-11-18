import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("out"),
  port = Number(process.env.PORT || 3000);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain",
};
await stat(resolve(root, "index.html"));
const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }
    const url = new URL(req.url, "http://localhost");
    const path = decodeURIComponent(url.pathname);
    const filename = resolve(
      root,
      "." + (path.endsWith("/") ? path + "index.html" : path),
    );
    if (!filename.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const info = await stat(filename);
    if (!info.isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[extname(filename)] || "application/octet-stream",
      "Content-Length": info.size,
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(filename)
      .on("error", () => res.destroy())
      .pipe(res);
  } catch {
    res.writeHead(404).end();
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log("StudyOS is ready at http://127.0.0.1:" + port),
);
