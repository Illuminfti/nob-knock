import assert from "node:assert/strict";
import { test } from "node:test";
import { FEATURE_IDS } from "./knock-verify-drive.mjs";
import {
  COMMANDS,
  DEFAULT_URL,
  EVIDENCE_DIRNAME,
  helpText,
  looksLikeDevProcess,
  normalizeUrl,
  parseArgs,
  portFromUrl,
} from "./knock-verify.mjs";

test("parseArgs requires a command", () => {
  assert.match(parseArgs([]).error, /usage: knock-verify/);
});

test("parseArgs rejects unknown commands and flags", () => {
  assert.match(parseArgs(["explode"]).error, /unknown command: explode/);
  assert.match(parseArgs(["doctor", "--wat"]).error, /unknown flag: --wat/);
});

test("parseArgs accepts each command", () => {
  for (const command of COMMANDS.filter((c) => c !== "drive" && c !== "help")) {
    const parsed = parseArgs([command]);
    assert.equal(parsed.command, command);
    assert.equal(parsed.error, undefined);
  }
});

test("drive requires a known feature id", () => {
  assert.match(parseArgs(["drive"]).error, /drive requires a feature id/);
  assert.match(parseArgs(["drive", "not-a-feature"]).error, /unknown feature/);
  const parsed = parseArgs(["drive", "for-you-feed"]);
  assert.equal(parsed.feature, "for-you-feed");
  assert.equal(parsed.command, "drive");
});

test("drive accepts --feature=", () => {
  const parsed = parseArgs(["drive", "--feature=search-clips"]);
  assert.equal(parsed.feature, "search-clips");
});

test("all mapped features are driveable", () => {
  assert.deepEqual(FEATURE_IDS, [
    "for-you-feed",
    "search-clips",
    "like-and-login-gate",
    "following-receipts",
    "creator-profile",
  ]);
  for (const id of FEATURE_IDS) {
    assert.equal(parseArgs(["drive", id]).feature, id);
  }
});

test("evidence defaults to screenshot and accepts verdict", () => {
  assert.equal(parseArgs(["evidence"]).kind, "screenshot");
  assert.equal(parseArgs(["evidence", "verdict"]).kind, "verdict");
  assert.match(parseArgs(["evidence", "pdf"]).error, /unknown evidence kind/);
});

test("url defaults and trailing slash", () => {
  assert.equal(parseArgs(["doctor"]).url, DEFAULT_URL);
  assert.equal(
    parseArgs(["doctor", "--url", "http://127.0.0.1:8081"]).url,
    "http://127.0.0.1:8081/",
  );
});

test("normalizeUrl rejects non-http", () => {
  assert.match(normalizeUrl("file:///etc/passwd").error, /only http\/https/);
  assert.match(normalizeUrl("not a url").error, /not a valid URL/);
  assert.equal(normalizeUrl("http://127.0.0.1:8080/").url, "http://127.0.0.1:8080/");
});

test("portFromUrl reads the URL port", () => {
  assert.equal(portFromUrl("http://127.0.0.1:8081/"), 8081);
  assert.equal(portFromUrl("http://127.0.0.1/"), 8080);
});

test("--dry-run is only for launch, evidence, cleanup", () => {
  assert.equal(parseArgs(["cleanup", "--dry-run"]).dryRun, true);
  assert.equal(parseArgs(["launch", "--dry-run"]).dryRun, true);
  assert.equal(parseArgs(["evidence", "--dry-run"]).dryRun, true);
  assert.match(parseArgs(["doctor", "--dry-run"]).error, /--dry-run is only valid/);
});

test("unexpected extra args are rejected", () => {
  assert.match(parseArgs(["cleanup", "now"]).error, /unexpected argument: now/);
  assert.match(parseArgs(["drive", "for-you-feed", "extra"]).error, /unexpected argument: extra/);
});

test("help covers every command and feature", () => {
  const all = helpText();
  for (const command of COMMANDS) assert.match(all, new RegExp(`^  ${command}`, "m"));
  for (const id of FEATURE_IDS) assert.match(helpText("drive"), new RegExp(id));
  assert.match(all, new RegExp(EVIDENCE_DIRNAME));
  assert.match(helpText("nope"), /unknown help topic/);
});

test("looksLikeDevProcess matches npm run dev and vite, not this lever", () => {
  const nul = (...argv) => argv.join("\u0000");
  assert.equal(looksLikeDevProcess(nul("npm", "run", "dev")), true);
  assert.equal(looksLikeDevProcess(nul("node", "/ws/node_modules/.bin/vite", "dev")), true);
  assert.equal(looksLikeDevProcess(nul("node", "knock-verify.mjs", "launch")), false);
  assert.equal(looksLikeDevProcess(nul("node", "scripts/preview.mjs", "restart")), false);
});
