import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PGLITE_RUNTIME_ASSETS = [
  "pglite.data",
  "pglite.wasm",
  "initdb.wasm",
];

async function assertFile(path) {
  const details = await stat(path);
  if (!details.isFile()) {
    throw new Error(`Expected a file at ${path}`);
  }
}

export async function findFunctionLibDirs(outputRoot) {
  const result = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        if (!entry.isDirectory()) return;
        const path = join(directory, entry.name);
        if (entry.name.endsWith(".func")) {
          result.push(join(path, "_libs"));
          return;
        }
        await visit(path);
      }),
    );
  }

  await visit(outputRoot);
  return result.sort();
}

export function resolvePgliteDist() {
  const require = createRequire(import.meta.url);
  return dirname(require.resolve("@electric-sql/pglite"));
}

export async function copyPgliteAssets({
  outputRoot = resolve(".vercel/output/functions"),
  sourceDir = resolvePgliteDist(),
} = {}) {
  const sourcePaths = PGLITE_RUNTIME_ASSETS.map((asset) =>
    join(sourceDir, asset),
  );
  await Promise.all(sourcePaths.map(assertFile));

  const destinations = await findFunctionLibDirs(outputRoot);
  if (destinations.length === 0) {
    throw new Error(`No Vercel function bundles found below ${outputRoot}`);
  }

  await Promise.all(
    destinations.flatMap((destination) =>
      PGLITE_RUNTIME_ASSETS.map(async (asset) => {
        await mkdir(destination, { recursive: true });
        await copyFile(join(sourceDir, asset), join(destination, asset));
      }),
    ),
  );

  return {
    assets: [...PGLITE_RUNTIME_ASSETS],
    destinations,
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await copyPgliteAssets();
  console.log(
    `Copied ${result.assets.length} PGlite runtime assets into ${result.destinations.length} Vercel function bundle(s).`,
  );
}
