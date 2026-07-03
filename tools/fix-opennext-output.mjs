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

const objectGuardSource = `function __secondAiObjectGuard(value, label) {
  if (value == null) {
    const error = new Error("[second-ai-object-guard] " + label + " is " + value);
    console.error(error.stack);
    return {};
  }
  return value;
}
`;

const insertObjectGuard = (source) => {
  if (source.includes("function __secondAiObjectGuard(")) {
    return source;
  }

  const importMatch = source.match(/^(?:import[^\n]*\n)+/);
  const insertAt = importMatch ? importMatch[0].length : 0;
  return source.slice(0, insertAt) + objectGuardSource + source.slice(insertAt);
};

const patchObjectNullRisks = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let source = fs.readFileSync(filePath, "utf8");
  const original = source;
  source = insertObjectGuard(source);

  const replacements = [
    [
      "Object.entries(env)",
      `Object.entries(__secondAiObjectGuard(env, "${label}: env"))`,
    ],
    [
      "Object.entries(runtimeEnv)",
      `Object.entries(__secondAiObjectGuard(runtimeEnv, "${label}: runtimeEnv"))`,
    ],
    [
      "Object.entries(result.headers)",
      `Object.entries(__secondAiObjectGuard(result.headers, "${label}: result.headers"))`,
    ],
    [
      "Object.entries(eventHeaders)",
      `Object.entries(__secondAiObjectGuard(eventHeaders, "${label}: eventHeaders"))`,
    ],
    [
      "Object.entries(query)",
      `Object.entries(__secondAiObjectGuard(query, "${label}: query"))`,
    ],
    [
      "Object.entries(headers)",
      `Object.entries(__secondAiObjectGuard(headers, "${label}: headers"))`,
    ],
    [
      "Object.entries(middlewareHeaders)",
      `Object.entries(__secondAiObjectGuard(middlewareHeaders, "${label}: middlewareHeaders"))`,
    ],
    [
      "Object.entries(AppPathRoutesManifest)",
      `Object.entries(__secondAiObjectGuard(AppPathRoutesManifest, "${label}: AppPathRoutesManifest"))`,
    ],
    [
      "Object.keys(PagesManifest)",
      `Object.keys(__secondAiObjectGuard(PagesManifest, "${label}: PagesManifest"))`,
    ],
    [
      "Object.values(AppPathRoutesManifest)",
      `Object.values(__secondAiObjectGuard(AppPathRoutesManifest, "${label}: AppPathRoutesManifest"))`,
    ],
    [
      "Object.keys(event.headers)",
      `Object.keys(__secondAiObjectGuard(event.headers, "${label}: event.headers"))`,
    ],
    [
      "Object.keys(process.env)",
      `Object.keys(__secondAiObjectGuard(process.env, "${label}: process.env"))`,
    ],
    [
      "Object.entries(process.env)",
      `Object.entries(__secondAiObjectGuard(process.env, "${label}: process.env"))`,
    ],
    [
      "Object.keys(manifest.functions)",
      `Object.keys(__secondAiObjectGuard(manifest.functions, "${label}: manifest.functions"))`,
    ],
    [
      "manifest.functions[foundPage]",
      `__secondAiObjectGuard(manifest.functions, "${label}: manifest.functions")[foundPage]`,
    ],
  ];

  for (const [from, to] of replacements) {
    if (source.includes(from) && !source.includes(to)) {
      source = source.replaceAll(from, to);
    }
  }

  if (source !== original) {
    fs.writeFileSync(filePath, source);
    return true;
  }

  return false;
};

const objectGuardedFiles = [
  [indexFile, "server index"],
  [handlerFile, "server handler"],
];

const patchedObjectGuardFiles = objectGuardedFiles
  .filter(([filePath, label]) => patchObjectNullRisks(filePath, label))
  .map(([filePath]) => path.relative(root, filePath));

const cloudflareInitFile = path.join(openNextDir, "cloudflare", "init.js");
if (fs.existsSync(cloudflareInitFile)) {
  let initSource = fs.readFileSync(cloudflareInitFile, "utf8");
  initSource = initSource
    .replace(
      "function populateProcessEnv(url, env) {\n  for (const [key, value] of Object.entries(env)) {",
      "function populateProcessEnv(url, env) {\n  globalThis.process ??= process;\n  process.env ??= {};\n  const runtimeEnv = env ?? {};\n  for (const [key, value] of Object.entries(runtimeEnv)) {",
    )
    .replace(
      "  const mode = env.NEXTJS_ENV ?? \"production\";",
      "  const mode = runtimeEnv.NEXTJS_ENV ?? \"production\";",
    )
    .replace(/globalThis\.__dirname\s*\?\?=\s*"";/g, 'globalThis.__dirname ??= "/";')
    .replace(/globalThis\.__filename\s*\?\?=\s*"";/g, 'globalThis.__filename ??= "/worker.js";');
  fs.writeFileSync(cloudflareInitFile, initSource);
}

const middlewareOutputFile = path.join(openNextDir, "middleware", "handler.mjs");
if (fs.existsSync(middlewareOutputFile)) {
  let middlewareSource = fs.readFileSync(middlewareOutputFile, "utf8");
  middlewareSource = middlewareSource
    .replace(
      "globalThis.process = process;\n  for (const [key, value] of Object.entries(env)) {",
      "globalThis.process = process;\n  process.env ??= {};\n  const runtimeEnv = env ?? {};\n  for (const [key, value] of Object.entries(runtimeEnv)) {",
    )
    .replace(
      "const mode = env.NEXTJS_ENV ?? \"production\";",
      "const mode = runtimeEnv.NEXTJS_ENV ?? \"production\";",
    );
  fs.writeFileSync(middlewareOutputFile, middlewareSource);
}

for (const [filePath, label] of [
  [cloudflareInitFile, "cloudflare init"],
  [middlewareOutputFile, "middleware handler"],
]) {
  if (patchObjectNullRisks(filePath, label)) {
    patchedObjectGuardFiles.push(path.relative(root, filePath));
  }
}

if (patchedObjectGuardFiles.length > 0) {
  console.log(
    `[cloudflare] Added object null guards with stack traces:\n${patchedObjectGuardFiles.join("\n")}`,
  );
}

const workerFile = path.join(openNextDir, "worker.js");
if (fs.existsSync(workerFile)) {
  let workerSource = fs.readFileSync(workerFile, "utf8");
  const fetchStart =
    "    async fetch(request, env, ctx) {\n        return runWithCloudflareRequestContext(request, env, ctx, async () => {";
  if (workerSource.includes(fetchStart) && !workerSource.includes("[second-ai-worker-error]")) {
    workerSource = workerSource.replace(
      fetchStart,
      `    async fetch(request, env, ctx) {
        try {
            globalThis.process ??= { env: {} };
            globalThis.process.env ??= {};
            if (env && typeof env === "object") {
                for (const [key, value] of Object.entries(env)) {
                    if (typeof value === "string") {
                        globalThis.process.env[key] = value;
                    }
                }
            }
            return await runWithCloudflareRequestContext(request, env ?? {}, ctx, async () => {`,
    );

    const fetchEnd = "        });\n    },\n};";
    workerSource = workerSource.replace(
      fetchEnd,
      `        });
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error(String(error));
            console.error("[second-ai-worker-error]", {
                name: normalizedError.name,
                message: normalizedError.message,
                stack: normalizedError.stack,
                url: request.url,
                hasProcess: typeof process !== "undefined",
                hasProcessEnv: typeof process !== "undefined" && !!process.env,
                envKeys: Object.keys(env ?? {}),
                processEnvKeys: typeof process !== "undefined" ? Object.keys(process.env ?? {}) : [],
            });
            console.error(normalizedError.stack);
            const debugUrl = new URL(request.url);
            if (debugUrl.searchParams.get("__debug") === "1") {
                return new Response(JSON.stringify({
                    name: normalizedError.name,
                    message: normalizedError.message,
                    stack: normalizedError.stack,
                    url: request.url,
                    envKeys: Object.keys(env ?? {}),
                    processEnvKeys: typeof process !== "undefined" ? Object.keys(process.env ?? {}) : [],
                }, null, 2), {
                    status: 500,
                    headers: { "content-type": "application/json; charset=utf-8" },
                });
            }
            return new Response("Internal Server Error", { status: 500 });
        }
    },
};`,
    );
    workerSource = workerSource
      .replace("handleCdnCgiImageRequest(url, env)", "handleCdnCgiImageRequest(url, env ?? {})")
      .replace("handleImageRequest(url, request.headers, env)", "handleImageRequest(url, request.headers, env ?? {})")
      .replace("middlewareHandler(request, env, ctx)", "middlewareHandler(request, env ?? {}, ctx)")
      .replace("handler(reqOrResp, env, ctx, request.signal)", "handler(reqOrResp, env ?? {}, ctx, request.signal)");
    fs.writeFileSync(workerFile, workerSource);
    console.log("[cloudflare] Added Worker entrypoint error diagnostics.");
  }
}

if (patchedEsmFiles.length > 0) {
  console.log(
    `[cloudflare] Patched ESM server output to avoid global require:\n${patchedEsmFiles.join("\n")}`,
  );
}

if (fs.existsSync(handlerFile)) {
  let serverHandlerSource = fs.readFileSync(handlerFile, "utf8");
  if (!serverHandlerSource.includes("[second-ai-nextjs-request-failed]")) {
    serverHandlerSource = serverHandlerSource
      .replaceAll(
        'error("NextJS request failed.",e)',
        'console.error("[second-ai-nextjs-request-failed]",{name:e?.name,message:e?.message,stack:e?.stack})',
      )
      .replaceAll(
        'error("NextJS request failed.",e),',
        'console.error("[second-ai-nextjs-request-failed]",{name:e?.name,message:e?.message,stack:e?.stack}),',
      );
    fs.writeFileSync(handlerFile, serverHandlerSource);
    console.log("[cloudflare] Added Next.js request failure diagnostics.");
  }
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
