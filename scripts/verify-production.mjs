import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const failures = [];

const trackedFiles = new Set(execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).trim().split("\n"));
for (const deleted of execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=D"], { cwd: root, encoding: "utf8" }).trim().split("\n")) {
  if (deleted) trackedFiles.delete(deleted);
}
for (const file of [".env", ".env.development", ".env.local", ".env.production"]) {
  if (trackedFiles.has(file)) failures.push(`Environment-specific file must not be tracked: ${file}`);
}

for (const file of ["public/_headers", "public/robots.txt", "public/sitemap.xml", "docs/GO_LIVE_CHECKLIST.md"]) {
  if (!existsSync(resolve(root, file))) failures.push(`Missing release file: ${file}`);
}

function walk(directory, visitor) {
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory)) {
    if (["node_modules", ".git", "dist"].includes(name)) continue;
    const entry = join(directory, name);
    if (statSync(entry).isDirectory()) walk(entry, visitor);
    else visitor(entry);
  }
}

walk(resolve(root, "src"), (file) => {
  if (!/\.(ts|tsx|js|jsx)$/.test(file)) return;
  const source = readFileSync(file, "utf8");
  if (/eventplanr|lovable\.app/i.test(source)) failures.push(`Foreign/legacy production domain: ${relative(root, file)}`);
});

const impressum = readFileSync(resolve(root, "src/pages/Impressum.tsx"), "utf8");
if (/\[(Straße|PLZ|Ort|Name|Nummer|Adresse|DEXXXXXXXXX)|wird ergänzt/.test(impressum)) {
  console.warn("WARNING: Impressum still contains launch-blocking company placeholders.");
}

if (failures.length) {
  console.error("Production verification failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("Production source verification passed.");
