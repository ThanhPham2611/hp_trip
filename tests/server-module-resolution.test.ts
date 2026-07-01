import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const workspaceRoot = process.cwd();
const entry = path.join(workspaceRoot, "api", "[...path].ts");

function localSourceForSpecifier(importer: string, specifier: string) {
  const resolved = path.resolve(path.dirname(importer), specifier);
  const candidates = specifier.endsWith(".js")
    ? [resolved.replace(/\.js$/, ".ts")]
    : [`${resolved}.ts`, path.join(resolved, "index.ts")];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function relativeImportSpecifiers(filename: string) {
  const source = fs.readFileSync(filename, "utf8");
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const imports: string[] = [];

  file.forEachChild((node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith(".")) imports.push(specifier);
    }
  });

  return imports;
}

describe("Vercel server module resolution", () => {
  it("uses explicit .js extensions for local ESM imports reachable from API functions", () => {
    const pending = [entry];
    const visited = new Set<string>();
    const extensionlessImports: string[] = [];

    while (pending.length > 0) {
      const current = pending.pop();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      for (const specifier of relativeImportSpecifiers(current)) {
        if (!path.extname(specifier)) {
          extensionlessImports.push(`${path.relative(workspaceRoot, current)} -> ${specifier}`);
        }

        const localSource = localSourceForSpecifier(current, specifier);
        if (localSource && !visited.has(localSource)) pending.push(localSource);
      }
    }

    expect(extensionlessImports).toEqual([]);
  });
});
