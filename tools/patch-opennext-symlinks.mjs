import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const pnpmDir = path.join(process.cwd(), "node_modules", ".pnpm");

function findCopyTracedFiles() {
  if (!existsSync(pnpmDir)) return null;

  const awsPackageDir = readdirSync(pnpmDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .find((name) => name.startsWith("@opennextjs+aws@"));

  if (!awsPackageDir) return null;

  return path.join(
    pnpmDir,
    awsPackageDir,
    "node_modules",
    "@opennextjs",
    "aws",
    "dist",
    "build",
    "copyTracedFiles.js",
  );
}

function findCreateServerBundle() {
  if (!existsSync(pnpmDir)) return null;

  const cloudflarePackageDir = readdirSync(pnpmDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .find((name) => name.startsWith("@opennextjs+cloudflare@"));

  if (!cloudflarePackageDir) return null;

  return path.join(
    pnpmDir,
    cloudflarePackageDir,
    "node_modules",
    "@opennextjs",
    "cloudflare",
    "dist",
    "cli",
    "build",
    "open-next",
    "createServerBundle.js",
  );
}

const targetFile = findCopyTracedFiles();

if (!targetFile || !existsSync(targetFile)) {
  console.warn("[cloudflare] OpenNext copyTracedFiles.js not found; skipping symlink patch.");
  process.exit(0);
}

const source = readFileSync(targetFile, "utf8");

if (source.includes("Second AI Cloudflare symlink patch")) {
  console.log("[cloudflare] OpenNext symlink patch already applied.");
} else {
  const original = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }
        else {`;

  const patched = `        if (symlink) {
            try {
                // Second AI Cloudflare symlink patch:
                // Wrangler cannot upload output directories containing pnpm symlinks.
                // Copy the real target into .open-next instead of preserving the link.
                const realTarget = path.resolve(path.dirname(from), symlink);
                if (statSync(realTarget).isDirectory()) {
                    cpSync(realTarget, to, { recursive: true, dereference: true });
                }
                else {
                    copyFileAndMakeOwnerWritable(realTarget, to);
                }
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }
        else {`;

  if (!source.includes(original)) {
    console.warn("[cloudflare] OpenNext symlink block shape changed; skipping patch.");
  } else {
    writeFileSync(targetFile, source.replace(original, patched));
    console.log("[cloudflare] OpenNext symlink patch applied.");
  }
}


const serverBundleFile = findCreateServerBundle();

if (!serverBundleFile || !existsSync(serverBundleFile)) {
  console.warn("[cloudflare] OpenNext createServerBundle.js not found; skipping runtime package patch.");
  process.exit(0);
}

const bundleSource = readFileSync(serverBundleFile, "utf8");

if (bundleSource.includes("Second AI Cloudflare runtime package patch")) {
  const nextBundleSource = bundleSource
    .replace(
      'for (const pkg of ["@swc/helpers", "styled-jsx"])',
      'for (const pkg of ["@swc/helpers", "styled-jsx", "client-only"])',
    )
    .replace(
      "if (fs.existsSync(sourcePkg) && !fs.existsSync(targetPkg))",
      "if (fs.existsSync(sourcePkg))",
    );

  if (nextBundleSource !== bundleSource) {
    writeFileSync(serverBundleFile, nextBundleSource);
    console.log("[cloudflare] OpenNext runtime package patch updated.");
  } else {
    console.log("[cloudflare] OpenNext runtime package patch already applied.");
  }
  process.exit(0);
}

const bundleOriginal = `    if (getOpenNextConfig(options).cloudflare?.useWorkerdCondition !== false) {`;

const bundlePatched = `    // Second AI Cloudflare runtime package patch:
    // Next 16 + pnpm can miss these runtime packages when OpenNext bundles the server.
    for (const pkg of ["@swc/helpers", "styled-jsx", "client-only"]) {
        const sourcePkg = path.join(appPath, "node_modules", pkg);
        const targetPkg = path.join(outPackagePath, "node_modules", pkg);
        if (fs.existsSync(sourcePkg)) {
            fs.mkdirSync(path.dirname(targetPkg), { recursive: true });
            fs.cpSync(sourcePkg, targetPkg, { recursive: true, dereference: true });
        }
    }
    if (getOpenNextConfig(options).cloudflare?.useWorkerdCondition !== false) {`;

if (!bundleSource.includes(bundleOriginal)) {
  console.warn("[cloudflare] OpenNext bundle hook shape changed; skipping runtime package patch.");
  process.exit(0);
}

writeFileSync(serverBundleFile, bundleSource.replace(bundleOriginal, bundlePatched));
console.log("[cloudflare] OpenNext runtime package patch applied.");
