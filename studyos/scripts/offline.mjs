import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = await readdir("out", { recursive: true, withFileTypes: true });
const urls = files
  .filter(
    (f) =>
      f.isFile() &&
      /\.(html|js|css|woff2|png|webp|svg|webmanifest)$/.test(f.name) &&
      f.name !== "sw.js",
  )
  .map(
    (f) =>
      "/" +
      (f.parentPath + "/" + f.name).replaceAll("\\", "/").replace(/^out\//, ""),
  );
const stamp = createHash("sha256")
  .update(await readFile("out/index.html"))
  .update(urls.join("|"))
  .digest("hex")
  .slice(0, 12);
await writeFile(
  "out/sw.js",
  `const CACHE='studyos-${stamp}';const ASSETS=${JSON.stringify(["/", ...urls])};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('studyos-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));return;}if(ASSETS.includes(u.pathname))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});`,
);
