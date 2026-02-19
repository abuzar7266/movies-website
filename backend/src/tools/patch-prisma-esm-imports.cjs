// Minimal patcher to make Prisma generated ESM imports resolvable by Node
// Adds ".js" extensions to relative import/export specifiers inside dist/generated/prisma/*.js
const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(__dirname, "..", "..", "dist", "generated", "prisma");

function addJsExt(spec) {
  if (!spec.startsWith(".")) return spec;
  if (/\.(js|mjs|cjs)$/.test(spec)) return spec;
  return spec + ".js";
}

function patchFile(file) {
  const p = path.join(DIST_DIR, file);
  if (!fs.existsSync(p)) return;
  const before = fs.readFileSync(p, "utf8");
  let after = before;
  after = after.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, (_, a, b, c) => a + addJsExt(b) + c);
  after = after.replace(/(export\s+[^'"]*from\s+['"])(\.[^'"]+)(['"])/g, (_, a, b, c) => a + addJsExt(b) + c);
  after = after.replace(/(import\(\s*['"])(\.[^'"]+)(['"]\s*\))/g, (_, a, b, c) => a + addJsExt(b) + c);
  if (after !== before) {
    fs.writeFileSync(p, after, "utf8");
    console.log(`[patch-prisma-esm-imports] Patched ${file}`);
  } else {
    console.log(`[patch-prisma-esm-imports] No changes for ${file}`);
  }
}

try {
  if (!fs.existsSync(DIST_DIR)) {
    console.warn(`[patch-prisma-esm-imports] Skipped: ${DIST_DIR} does not exist`);
    process.exit(0);
  }
  const files = [
    "client.js",
    "models.js",
    "browser.js",
    "commonInputTypes.js",
    "enums.js",
    path.join("internal", "class.js"),
    path.join("internal", "prismaNamespace.js"),
    path.join("internal", "prismaNamespaceBrowser.js"),
  ];
  for (const f of files) patchFile(f);
} catch (e) {
  console.error("[patch-prisma-esm-imports] Failed:", e);
  process.exit(1);
}

