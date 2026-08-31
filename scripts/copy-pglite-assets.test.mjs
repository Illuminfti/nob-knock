import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  PGLITE_RUNTIME_ASSETS,
  copyPgliteAssets,
  findFunctionLibDirs,
} from "./copy-pglite-assets.mjs";

async function fixture() {
  const root = await mkdtemp(join(os.tmpdir(), "knock-pglite-assets-"));
  const sourceDir = join(root, "source");
  const outputRoot = join(root, ".vercel", "output", "functions");
  await mkdir(sourceDir, { recursive: true });
  await Promise.all(
    PGLITE_RUNTIME_ASSETS.map((asset) =>
      writeFile(join(sourceDir, asset), `fixture:${asset}`),
    ),
  );
  return { root, sourceDir, outputRoot };
}

test("findFunctionLibDirs discovers nested Vercel function bundles", async (t) => {
  const { root, outputRoot } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  await mkdir(join(outputRoot, "api", "auth.func"), { recursive: true });
  await mkdir(join(outputRoot, "__server.func"), { recursive: true });
  await mkdir(join(outputRoot, "ordinary-directory"), { recursive: true });

  assert.deepEqual(await findFunctionLibDirs(outputRoot), [
    join(outputRoot, "__server.func", "_libs"),
    join(outputRoot, "api", "auth.func", "_libs"),
  ]);
});

test("copyPgliteAssets places every runtime asset beside each function", async (t) => {
  const { root, sourceDir, outputRoot } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const functions = [
    join(outputRoot, "__server.func"),
    join(outputRoot, "nested", "worker.func"),
  ];
  await Promise.all(functions.map((path) => mkdir(path, { recursive: true })));

  const result = await copyPgliteAssets({ sourceDir, outputRoot });
  assert.equal(result.destinations.length, functions.length);

  for (const functionDir of functions) {
    for (const asset of PGLITE_RUNTIME_ASSETS) {
      assert.equal(
        await readFile(join(functionDir, "_libs", asset), "utf8"),
        `fixture:${asset}`,
      );
    }
  }
});

test("copyPgliteAssets fails loudly when the build produced no functions", async (t) => {
  const { root, sourceDir, outputRoot } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(outputRoot, { recursive: true });

  await assert.rejects(
    copyPgliteAssets({ sourceDir, outputRoot }),
    /No Vercel function bundles found/,
  );
});

test("copyPgliteAssets fails before copying an incomplete PGlite install", async (t) => {
  const { root, sourceDir, outputRoot } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(outputRoot, "__server.func"), { recursive: true });
  await rm(join(sourceDir, "pglite.data"));

  await assert.rejects(
    copyPgliteAssets({ sourceDir, outputRoot }),
    /pglite\.data/,
  );
});
