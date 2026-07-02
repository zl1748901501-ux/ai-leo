import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pnpmDir = path.join(root, "node_modules", ".pnpm");

const runtimePackages = [
  {
    name: "@swc/helpers",
    pnpmPrefix: "@swc+helpers@",
    packagePath: ["node_modules", "@swc", "helpers"],
    targetPath: ["node_modules", "@swc", "helpers"],
  },
  {
    name: "styled-jsx",
    pnpmPrefix: "styled-jsx@",
    packagePath: ["node_modules", "styled-jsx"],
    targetPath: ["node_modules", "styled-jsx"],
  },
  {
    name: "client-only",
    pnpmPrefix: "client-only@",
    packagePath: ["node_modules", "client-only"],
    targetPath: ["node_modules", "client-only"],
  },
];

const findPackageInPnpm = (pkg) => {
  if (!fs.existsSync(pnpmDir)) {
    return null;
  }

  const match = fs
    .readdirSync(pnpmDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .find((name) => name.startsWith(pkg.pnpmPrefix));

  if (!match) {
    return null;
  }

  return path.join(pnpmDir, match, ...pkg.packagePath);
};

for (const pkg of runtimePackages) {
  const target = path.join(root, ...pkg.targetPath);
  if (fs.existsSync(target)) {
    continue;
  }

  const source = findPackageInPnpm(pkg);
  if (!source || !fs.existsSync(source)) {
    throw new Error(`[cloudflare] Could not find ${pkg.name} in pnpm store.`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, dereference: true });
  console.log(`[cloudflare] Prepared runtime package: ${pkg.name}`);
}
