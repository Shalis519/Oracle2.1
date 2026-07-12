// Cross-platform preinstall guard (works on Windows/macOS/Linux, no shell needed).
// - Removes stray lockfiles from other package managers.
// - Refuses to run if the install wasn't started with pnpm.
import { existsSync, unlinkSync } from "node:fs";

for (const file of ["package-lock.json", "yarn.lock"]) {
  if (existsSync(file)) {
    unlinkSync(file);
  }
}

const userAgent = process.env.npm_config_user_agent ?? "";
if (!userAgent.startsWith("pnpm/")) {
  console.error('This project uses pnpm. Run "pnpm install" instead.');
  process.exit(1);
}
