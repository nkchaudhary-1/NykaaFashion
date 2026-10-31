// "Why won't it start?" — checks what most often stops a fresh checkout from running and says how to fix each thing.
//   npm run doctor
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";

const root = new URL("../", import.meta.url);
const path = (p) => new URL(p, root);
const pkg = JSON.parse(readFileSync(path("package.json"), "utf8"));
let problems = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg, fix) => {
  problems++;
  console.log(`  ✗ ${msg}\n      → ${fix}`);
};
const note = (msg, fix) => console.log(`  ! ${msg}\n      → ${fix}`);
const run = (cmd) => {
  try {
    return execSync(cmd, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
};

console.log("Nykaa Fashion prototype — checking this machine\n");

// 1. Node
const [major, minor] = process.versions.node.split(".").map(Number);
if (major > 20 || (major === 20 && minor >= 9)) ok(`Node ${process.versions.node}`);
else fail(`Node ${process.versions.node} is too old (Next.js 16 needs 20.9 or newer)`, "install Node 22 from https://nodejs.org, or `nvm install` (this repo has an .nvmrc), then reinstall dependencies");

// 2. Dependencies
const nextPkg = path("node_modules/next/package.json");
if (!existsSync(nextPkg)) fail("dependencies are not installed", "run `npm ci` (or `npm install`) in the project folder");
else {
  const installed = JSON.parse(readFileSync(nextPkg, "utf8")).version;
  if (installed === pkg.dependencies.next) ok(`dependencies installed (next ${installed})`);
  else fail(`next ${installed} is installed but package.json wants ${pkg.dependencies.next}`, "run `npm ci` to match the lockfile");
}

// 3. Right version of the project (the repo's default branch is the earlier design)
const branch = run("git rev-parse --abbrev-ref HEAD");
if (existsSync(path("public/brand/nykaa-fashion-logo.svg")) && existsSync(path("src/components/layout/logo-paths.ts"))) ok(`live-identity version of the prototype${branch ? ` (branch ${branch})` : ""}`);
else fail(`this looks like the earlier design${branch ? ` (branch ${branch})` : ""} — the wordmark and live-site header are missing`, "git fetch origin && git checkout claude/nykaa-fashion-grid-redesign, then `npm ci`");

// 4. Self-hosted fonts
if (existsSync(path("public/fonts/inter-latin.woff2")) && existsSync(path("public/fonts/inter-latin-ext.woff2"))) ok("Inter font files present (nothing is downloaded from a font CDN)");
else fail("public/fonts is missing the Inter files", "restore them with `git checkout -- public/fonts` (the page would fall back to a system font)");

// 5. Port
const portBusy = await new Promise((resolve) => {
  const s = net.connect({ port: 3000, host: "127.0.0.1" });
  s.setTimeout(800);
  s.on("connect", () => (s.destroy(), resolve(true)));
  s.on("timeout", () => (s.destroy(), resolve(false)));
  s.on("error", () => resolve(false));
});
if (portBusy) note("something is already listening on port 3000", "stop it, or run `npm run dev -- -p 3001` and open http://localhost:3001");
else ok("port 3000 is free");

console.log(
  problems
    ? `\n${problems} problem${problems === 1 ? "" : "s"} found — fix the ✗ lines, then run \`npm run dev\`.`
    : "\nAll good. Run `npm run dev` and open http://localhost:3000 — the first page takes 10–30 s to compile, later ones are quick.",
);
process.exit(problems ? 1 : 0);
