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

const patchEsmRequire = (filePath) => {
  let source = fs.readFileSync(filePath, "utf8");
  if (!/(?<![\w$])require(?![\w$])/.test(source)) {
    return false;
  }

  const createRequireImport =
    'import { createRequire as __cloudflareCreateRequire } from "node:module";\n' +
    "const __cloudflareRequire = __cloudflareCreateRequire(import.meta.url);\n";

  if (!source.includes("__cloudflareCreateRequire")) {
    const importMatch = source.match(/^(?:import[^\n]*\n)+/);
    const insertAt = importMatch ? importMatch[0].length : 0;
    source =
      source.slice(0, insertAt) +
      createRequireImport +
      source.slice(insertAt);
  }

  source = source
    .replace(/(?<![\w$])require\s*\(/g, "__cloudflareRequire(")
    .replace(/typeof require\b/g, "typeof __cloudflareRequire")
    .replace(/(?<![\w$])require\.apply\b/g, "__cloudflareRequire.apply")
    .replace(/(?<![\w$])require(?![\w$])/g, "__cloudflareRequire");

  fs.writeFileSync(filePath, source);
  return true;
};

const patchedEsmFiles = [];
for (const entry of fs.readdirSync(defaultFunctionDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".mjs")) {
    continue;
  }
  const filePath = path.join(defaultFunctionDir, entry.name);
  if (patchEsmRequire(filePath)) {
    patchedEsmFiles.push(path.relative(root, filePath));
  }
}

if (patchedEsmFiles.length > 0) {
  console.log(
    `[cloudflare] Patched ESM server output to avoid global require:\n${patchedEsmFiles.join("\n")}`,
  );
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
