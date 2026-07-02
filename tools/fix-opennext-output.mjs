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
  const needsRequirePatch = /(?<![\w$])require(?![\w$])/.test(source);
  const needsDirnamePatch = /\b(__dirname|__filename|process\.cwd|process\.chdir)\b/.test(
    source,
  );

  if (!needsRequirePatch && !needsDirnamePatch) {
    return false;
  }

  let shim = "";
  if (needsRequirePatch && !source.includes("__cloudflareCreateRequire")) {
    shim +=
      'import { createRequire as __cloudflareCreateRequire } from "node:module";\n' +
      "const __cloudflareRequire = __cloudflareCreateRequire('file:///worker.js');\n" +
      "const __cloudflareUrlModule = __cloudflareRequire('node:url');\n" +
      "const __cloudflareOriginalFileURLToPath = __cloudflareUrlModule.fileURLToPath;\n" +
      "const __cloudflareOriginalPathToFileURL = __cloudflareUrlModule.pathToFileURL;\n" +
      "__cloudflareUrlModule.fileURLToPath = (value, ...args) => __cloudflareOriginalFileURLToPath(value || 'file:///worker.js', ...args);\n" +
      "__cloudflareUrlModule.pathToFileURL = (value, ...args) => __cloudflareOriginalPathToFileURL(value || '/', ...args);\n";
  }

  if (needsDirnamePatch && !source.includes("__cloudflareDirname")) {
    shim +=
      'const __cloudflareDirname = "/";\n' +
      'const __cloudflareFilename = "/worker.js";\n' +
      "var __dirname = globalThis.__dirname || __cloudflareDirname;\n" +
      "var __filename = globalThis.__filename || __cloudflareFilename;\n" +
      "globalThis.__dirname = __dirname;\n" +
      "globalThis.__filename = __filename;\n" +
      "if (typeof process !== \"undefined\") {\n" +
      "  process.cwd = () => __cloudflareDirname;\n" +
      "  process.chdir = () => undefined;\n" +
      "}\n";
  }

  if (shim) {
    const importMatch = source.match(/^(?:import[^\n]*\n)+/);
    const insertAt = importMatch ? importMatch[0].length : 0;
    source = source.slice(0, insertAt) + shim + source.slice(insertAt);
  }

  if (needsRequirePatch) {
    source = source
      .replace(/(?<![\w$])require\s*\(/g, "__cloudflareRequire(")
      .replace(/typeof require\b/g, "typeof __cloudflareRequire")
      .replace(/(?<![\w$])require\.apply\b/g, "__cloudflareRequire.apply")
      .replace(/(?<![\w$])require(?![\w$])/g, "__cloudflareRequire");
  }

  if (needsDirnamePatch) {
    source = source
      .replace(/globalThis\.__dirname\s*\?\?=\s*"";/g, "globalThis.__dirname ||= __cloudflareDirname;")
      .replace(/globalThis\.__filename\s*\?\?=\s*"";/g, "globalThis.__filename ||= __cloudflareFilename;");
  }

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

const middlewareHandlerFile = path.join(openNextDir, "middleware", "handler.mjs");
if (fs.existsSync(middlewareHandlerFile) && patchEsmRequire(middlewareHandlerFile)) {
  patchedEsmFiles.push(path.relative(root, middlewareHandlerFile));
}

const cloudflareInitFile = path.join(openNextDir, "cloudflare", "init.js");
if (fs.existsSync(cloudflareInitFile)) {
  let initSource = fs.readFileSync(cloudflareInitFile, "utf8");
  initSource = initSource
    .replace(/globalThis\.__dirname\s*\?\?=\s*"";/g, 'globalThis.__dirname ??= "/";')
    .replace(/globalThis\.__filename\s*\?\?=\s*"";/g, 'globalThis.__filename ??= "/worker.js";');
  fs.writeFileSync(cloudflareInitFile, initSource);
}

if (patchedEsmFiles.length > 0) {
  console.log(
    `[cloudflare] Patched ESM server output to avoid global require:\n${patchedEsmFiles.join("\n")}`,
  );
}

const copyFileIfChanged = (sourcePath, targetPath) => {
  if (!fs.existsSync(sourcePath)) {
    return false;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const source = fs.readFileSync(sourcePath);
  if (fs.existsSync(targetPath) && fs.readFileSync(targetPath).equals(source)) {
    return false;
  }

  fs.writeFileSync(targetPath, source);
  return true;
};

const requiredServerManifests = [
  "app-paths-manifest.json",
  "functions-config-manifest.json",
  "interception-route-rewrite-manifest.js",
  "middleware-build-manifest.js",
  "middleware-manifest.json",
  "middleware-react-loadable-manifest.js",
  "next-font-manifest.js",
  "next-font-manifest.json",
  "pages-manifest.json",
  "prefetch-hints.json",
  "server-reference-manifest.js",
  "server-reference-manifest.json",
];

const nextServerDir = path.join(root, ".next", "server");
const outputNextServerDir = path.join(defaultFunctionDir, ".next", "server");
const rootOutputNextServerDir = path.join(openNextDir, ".next", "server");
const copiedManifests = [];
for (const manifest of requiredServerManifests) {
  const sourcePath = path.join(nextServerDir, manifest);
  const targetPaths = [
    path.join(outputNextServerDir, manifest),
    path.join(rootOutputNextServerDir, manifest),
  ];

  for (const targetPath of targetPaths) {
    if (copyFileIfChanged(sourcePath, targetPath)) {
      copiedManifests.push(path.relative(root, targetPath));
    }
  }
}

const requiredOutputManifests = [
  "app-paths-manifest.json",
  "middleware-build-manifest.js",
  "middleware-manifest.json",
  "server-reference-manifest.json",
];

const missingOutputManifests = requiredOutputManifests.filter(
  (manifest) =>
    !fs.existsSync(path.join(outputNextServerDir, manifest)) ||
    !fs.existsSync(path.join(rootOutputNextServerDir, manifest)),
);

if (missingOutputManifests.length > 0) {
  throw new Error(
    `[cloudflare] Missing required Next server manifests in OpenNext output:\n${missingOutputManifests.join("\n")}`,
  );
}

if (copiedManifests.length > 0) {
  console.log(
    `[cloudflare] Copied missing Next server manifests:\n${copiedManifests.join("\n")}`,
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
