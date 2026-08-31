#!/usr/bin/env node
import { gzipSync } from "node:zlib";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const MiB = 1024 * 1024;
const limits = {
  maxClip: 11 * MiB,
  totalClips: 110 * MiB,
  maxPoster: 256 * 1024,
  totalPosters: 4 * MiB,
};

function filesUnder(root) {
  if (!existsSync(root)) return [];
  const output = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else output.push(path);
    }
  };
  visit(root);
  return output;
}

function total(files) {
  return files.reduce((sum, file) => sum + statSync(file).size, 0);
}

const clips = filesUnder("public/clips").filter((file) => extname(file) === ".mp4");
const posters = filesUnder("public/stills").filter((file) => /\.(?:jpe?g|png|webp)$/i.test(file));
const failures = [];

if (clips.length !== 20) failures.push(`expected 20 clips, found ${clips.length}`);
for (const clip of clips) {
  const bytes = readFileSync(clip);
  const moov = bytes.indexOf(Buffer.from("moov"));
  const mdat = bytes.indexOf(Buffer.from("mdat"));
  if (moov < 0 || mdat < 0 || moov > mdat) {
    failures.push(`${clip}: moov atom is not ahead of media data (not fast-start)`);
  }
  if (bytes.length > limits.maxClip) {
    failures.push(`${clip}: ${(bytes.length / MiB).toFixed(2)} MiB exceeds 11 MiB`);
  }
}
if (total(clips) > limits.totalClips) {
  failures.push(`clips total ${(total(clips) / MiB).toFixed(2)} MiB exceeds 110 MiB`);
}
for (const poster of posters) {
  const bytes = statSync(poster).size;
  if (bytes > limits.maxPoster) {
    failures.push(`${poster}: ${(bytes / 1024).toFixed(1)} KiB exceeds 256 KiB`);
  }
}
if (total(posters) > limits.totalPosters) {
  failures.push(`posters total ${(total(posters) / MiB).toFixed(2)} MiB exceeds 4 MiB`);
}

const buildRoot = [".output/public", "dist", ".vercel/output/static"].find(existsSync);
const buildAssets = buildRoot
  ? filesUnder(buildRoot).filter((file) => /\.(?:js|css)$/i.test(file))
  : [];
const buildReport = buildAssets
  .map((file) => {
    const bytes = readFileSync(file);
    return {
      file: relative(buildRoot, file),
      rawBytes: bytes.length,
      gzipBytes: gzipSync(bytes).length,
    };
  })
  .sort((a, b) => b.gzipBytes - a.gzipBytes);

const report = {
  clips: { count: clips.length, bytes: total(clips) },
  posters: { count: posters.length, bytes: total(posters) },
  buildRoot: buildRoot || null,
  largestBuildAssets: buildReport.slice(0, 15),
  failures,
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
