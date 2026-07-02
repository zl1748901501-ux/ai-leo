import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["exec", "next", "build", "--webpack"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    NEXT_PRIVATE_STANDALONE: "true",
    NEXT_PRIVATE_OUTPUT_TRACE_ROOT: process.cwd(),
  },
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
