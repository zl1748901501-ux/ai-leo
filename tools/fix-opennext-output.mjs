import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const openNextDir = path.join(root, ".open-next");
const defaultFunctionDir = path.join(openNextDir, "server-functions", "default");
const indexFile = path.join(defaultFunctionDir, "index.mjs");
const handlerFile = path.join(defaultFunctionDir, "handler.mjs");

if (!fs.existsSync(openNextDir)) {
  throw new Error("[cloudflare] .open-next was not generated. Run the OpenNext build first.");
}

if (!fs.existsSync(indexFile)) {
  throw new Error("[cloudflare] Missing .open-next/server-functions/default/index.mjs.");
}

if (!fs.existsSync(handlerFile)) {
  fs.writeFileSync(handlerFile, 'export { handler } from "./index.mjs";\n');
  console.log("[cloudflare] Added missing server function handler bridge.");
}

const linkedPaths = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const stat = fs.lstatSync(fullPath);
    if (stat.isSymbolicLink()) {
      linkedPaths.push(fullPath);
      continue;
    }
    if (entry.isDirectory()) {
      walk(fullPath);
    }
  }
};

walk(openNextDir);

if (linkedPaths.length > 0) {
  throw new Error(
    `[cloudflare] .open-next still contains symlinks:\n${linkedPaths
      .slice(0, 20)
      .join("\n")}`,
  );
}

console.log("[cloudflare] OpenNext output verified.");
