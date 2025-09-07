import { execSync } from "node:child_process";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
}

let base = "origin/main";
try { base = sh("git merge-base origin/main HEAD"); } catch {}

const changed = sh(`git diff --name-only ${base}...HEAD`)
  .split("\n")
  .filter(Boolean);

const codeRoots = [/^src\//, /^apps\//, /^packages\//];
const isCode = (p) => codeRoots.some((rx) => rx.test(p)) && !/\.test\.(t|j)sx?$/.test(p);

const touchedCode = changed.some(isCode);
const touchedDocs = changed.some((p) => /^docs\//.test(p));

if (touchedCode && !touchedDocs) {
  console.error(
    "Docs Drift Guard: Code changed but no docs/ touched.\n" +
    "→ Add/update something in docs/ (or use [no-docs] in commit msg for exceptions)."
  );
  process.exit(1);
}

console.log("Docs Drift Guard: OK");
