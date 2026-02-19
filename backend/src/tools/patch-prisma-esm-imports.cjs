const fs = require("node:fs");
const path = require("node:path");

const root =
  process.argv[2] ?? path.join(process.cwd(), "dist", "generated", "prisma");

function shouldPatchSpecifier(specifier) {
  if (!specifier.startsWith("./") && !specifier.startsWith("../")) return false;
  if (specifier.endsWith("/")) return false;
  const ext = path.posix.extname(specifier);
  return ext.length === 0;
}

function patchFile(filePath) {
  const input = fs.readFileSync(filePath, "utf8");
  let output = input;

  output = output.replace(
    /(\bfrom\s+['"])([^'"]+)(['"])/g,
    (_m, p1, specifier, p3) => {
      if (!shouldPatchSpecifier(specifier)) return p1 + specifier + p3;
      return p1 + specifier + ".js" + p3;
    },
  );

  output = output.replace(
    /(\bimport\s+['"])([^'"]+)(['"])/g,
    (_m, p1, specifier, p3) => {
      if (!shouldPatchSpecifier(specifier)) return p1 + specifier + p3;
      return p1 + specifier + ".js" + p3;
    },
  );

  if (output !== input) fs.writeFileSync(filePath, output);
}

function walk(dirPath) {
  for (const ent of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const p = path.join(dirPath, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.isFile() && p.endsWith(".js")) patchFile(p);
  }
}

if (fs.existsSync(root)) walk(root);
