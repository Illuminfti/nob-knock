#!/usr/bin/env node
/**
 * VERIFICATION SCAFFOLDING — not product code.
 *
 * Agent-facing CLI for Knock: launch, doctor, drive, evidence, cleanup.
 * Wraps the repo Playwright harnesses (scripts/feed-qa.mjs, scripts/browser-smoke.mjs).
 */
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  parseListenerInodes,
  parsePid,
  parsePgid,
  terminatePids,
} from "../../../scripts/preview.mjs";
import { isMainModule } from "../../../scripts/with-app-env.mjs";
import {
  buildAuthEnabled,
  compareAuthInvariant,
  probeDevAuthEnabled,
} from "../../../scripts/check-auth-invariant.mjs";
import { FEATURE_IDS, driveFeature } from "./knock-verify-drive.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const DEFAULT_URL = "http://127.0.0.1:8080/";
export const DEFAULT_PORT = 8080;
export const EVIDENCE_DIRNAME = "artifacts/verify-nob-knock";
export const RUN_STATE_REL = ".grok/knock-verify-run.json";
export const DEV_LOG_REL = ".grok/knock-verify-dev.log";
export const COMMANDS = ["launch", "doctor", "drive", "evidence", "cleanup", "help"];
export const EVIDENCE_KINDS = ["screenshot", "verdict"];
export const CHROMIUM_ARGS = ["--no-sandbox", "--disable-dev-shm-usage"];

const READY_MS = Number(process.env.KNOCK_VERIFY_READY_MS || 90_000);
const GRACE_MS = 3000;
const POLL_MS = 100;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function evidenceDirOf(root = ROOT) {
  return join(root, EVIDENCE_DIRNAME);
}

export function runStatePath(root = ROOT) {
  return join(root, RUN_STATE_REL);
}

function needValue(argv, i, flag) {
  const value = argv[i];
  if (!value || value.startsWith("--")) return { error: `${flag} requires a value` };
  return { value };
}

export function parseArgs(argv) {
  const flags = {
    dryRun: false,
    help: false,
    url: DEFAULT_URL,
    evidenceDir: null,
    feature: null,
    kind: null,
    helpTopic: null,
  };
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      flags.dryRun = true;
      continue;
    }
    if (arg === "--json") continue;
    if (arg === "--url" || arg === "--evidence-dir" || arg === "--feature" || arg === "--kind") {
      const got = needValue(argv, ++i, arg);
      if (got.error) return { error: got.error };
      if (arg === "--url") flags.url = got.value;
      if (arg === "--evidence-dir") flags.evidenceDir = got.value;
      if (arg === "--feature") flags.feature = got.value;
      if (arg === "--kind") flags.kind = got.value;
      continue;
    }
    if (arg.startsWith("--url=")) {
      flags.url = arg.slice("--url=".length);
      if (!flags.url) return { error: "--url requires a value" };
      continue;
    }
    if (arg.startsWith("--evidence-dir=")) {
      flags.evidenceDir = arg.slice("--evidence-dir=".length);
      if (!flags.evidenceDir) return { error: "--evidence-dir requires a value" };
      continue;
    }
    if (arg.startsWith("--feature=")) {
      flags.feature = arg.slice("--feature=".length);
      if (!flags.feature) return { error: "--feature requires a value" };
      continue;
    }
    if (arg.startsWith("--kind=")) {
      flags.kind = arg.slice("--kind=".length);
      if (!flags.kind) return { error: "--kind requires a value" };
      continue;
    }
    if (arg.startsWith("--")) return { error: `unknown flag: ${arg}` };
    positionals.push(arg);
  }

  if (flags.help && positionals.length === 0) {
    return { command: "help", ...flags, helpTopic: null };
  }

  const command = positionals[0];
  if (!command)
    return { error: "usage: knock-verify <command> [options]\nTry `knock-verify --help`." };
  if (!COMMANDS.includes(command)) {
    return { error: `unknown command: ${command}\nTry \`knock-verify --help\`.` };
  }

  const rest = positionals.slice(1);
  if (command === "help") {
    flags.helpTopic = rest[0] ?? null;
    if (rest.length > 1) return { error: `unexpected argument: ${rest[1]}` };
    return { command, ...flags };
  }
  if (command === "drive") {
    if (!flags.feature && rest[0]) flags.feature = rest[0];
    if (rest.length > 1) return { error: `unexpected argument: ${rest[1]}` };
    if (rest.length === 1 && flags.feature && rest[0] !== flags.feature) {
      return { error: `unexpected argument: ${rest[0]}` };
    }
  } else if (command === "evidence") {
    if (!flags.kind && rest[0]) flags.kind = rest[0];
    if (rest.length > 1) return { error: `unexpected argument: ${rest[1]}` };
  } else if (rest.length > 0) {
    return { error: `unexpected argument: ${rest[0]}` };
  }

  if (command === "drive" && flags.help) {
    return { command: "help", ...flags, helpTopic: "drive" };
  }
  if (flags.help) return { command: "help", ...flags, helpTopic: command };

  if (command === "drive") {
    if (!flags.feature) {
      return { error: `drive requires a feature id: ${FEATURE_IDS.join(" | ")}` };
    }
    if (!FEATURE_IDS.includes(flags.feature)) {
      return { error: `unknown feature: ${flags.feature} (expected ${FEATURE_IDS.join(", ")})` };
    }
  }
  if (command === "evidence") {
    flags.kind = flags.kind || "screenshot";
    if (!EVIDENCE_KINDS.includes(flags.kind)) {
      return {
        error: `unknown evidence kind: ${flags.kind} (expected ${EVIDENCE_KINDS.join(", ")})`,
      };
    }
  }
  if (flags.dryRun && command !== "launch" && command !== "cleanup" && command !== "evidence") {
    return { error: `--dry-run is only valid for launch, evidence, and cleanup (not ${command})` };
  }

  const normalized = normalizeUrl(flags.url);
  if (normalized.error) return { error: normalized.error };
  flags.url = normalized.url;

  return { command, ...flags };
}

export function normalizeUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { error: `not a valid URL: ${url}` };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: `only http/https URLs are allowed, got ${parsed.protocol} in ${url}` };
  }
  const href = parsed.href.endsWith("/") ? parsed.href : `${parsed.href}/`;
  return { url: href };
}

export function helpText(topic = null) {
  const topics = {
    launch: `launch — start npm run dev on :8080, or attach if that URL already answers

  knock-verify launch [--url <url>] [--dry-run]

  Ready: GET / returns HTTP. First compile + PGLite migrate can take ~15s.
  Attaches when the port already serves; does not kill a foreign owner.
  --dry-run prints attach-or-start and starts nothing.
  Run state: .grok/knock-verify-run.json   log: .grok/knock-verify-dev.log`,
    doctor: `doctor — read-only "is this instance worth driving?"

  knock-verify doctor [--url <url>]

  Checks: HTTP, title Knock, [data-active=true], Search button,
  Playwright Chromium, /__app-env sign-in flag (dev only).`,
    drive: `drive — exercise one mapped feature on the real UI

  knock-verify drive <feature> [--url <url>] [--evidence-dir <dir>]

  Features:
    for-you-feed          wraps scripts/feed-qa.mjs; ArrowDown skip + screenshots
    search-clips          Search sheet → query → jump to unsubscribe
    like-and-login-gate   Like while signed out → /login
    following-receipts    Following tab empty state
    creator-profile       Mike Hawk sheet → Play Lifehacker

  Recipes: .cursor/skills/verify-nob-knock/features/`,
    evidence: `evidence — write proof under artifacts/verify-nob-knock/

  knock-verify evidence [screenshot|verdict] [--url <url>] [--evidence-dir <dir>] [--dry-run]

  screenshot  one PNG of --url
  verdict     scripts/browser-smoke.mjs (desktop + mobile + JSON)
  --dry-run   print target paths; write nothing
  Cleanup never deletes this directory.`,
    cleanup: `cleanup — tear down instances this run started

  knock-verify cleanup [--dry-run]

  Signals only pids in .grok/knock-verify-run.json.
  Never pkill by name. Never deletes artifacts/verify-nob-knock/.
  Attach-only runs are a process no-op.
  --dry-run prints the plan and signals nothing.`,
    help: `help — this text, or one command

  knock-verify help [launch|doctor|drive|evidence|cleanup]`,
  };

  if (topic && topics[topic]) return topics[topic];
  if (topic) return `unknown help topic: ${topic}\n\n${topics.help}`;

  return `knock-verify — drive Knock (nob-knock) the way a user does

Usage:
  knock-verify <command> [options]

Commands:
  launch      Start the dev server on :8080, or attach if healthy
  doctor      Read-only health check
  drive       Exercise one feature from the map
  evidence    Screenshot or browser-smoke verdict
  cleanup     Stop pids this run started (keeps evidence)
  help        This message

Global:
  --url <url>             default ${DEFAULT_URL}
  --evidence-dir <dir>    default ${EVIDENCE_DIRNAME}
  --dry-run               launch / evidence / cleanup only
  --help, -h              command help
  --json                  accepted (JSON is always written to stdout)

Each command prints one JSON object. Non-zero exit means not ok.
See .cursor/skills/verify-nob-knock/SKILL.md and features/.

${topics.launch}

${topics.doctor}

${topics.drive}

${topics.evidence}

${topics.cleanup}`;
}

export function looksLikeDevProcess(cmdline) {
  const argv = String(cmdline ?? "")
    .split("\0")
    .filter(Boolean)
    .join(" ");
  if (/\bknock-verify\b/.test(argv)) return false;
  if (/\bpreview[\w-]*\.mjs\b/.test(argv)) return false;
  return /\brun\s+dev(?:\s|$)/.test(argv) || /\bvite\b/.test(argv);
}

export function portFromUrl(url) {
  try {
    const port = Number(new URL(url).port);
    return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT;
  } catch {
    return DEFAULT_PORT;
  }
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err?.code === "EPERM";
  }
}

function pgidOf(pid) {
  try {
    return parsePgid(readFileSync(`/proc/${pid}/stat`, "utf8"));
  } catch {
    return null;
  }
}

function killPid(pid, signal) {
  if (pgidOf(pid) === pid) {
    try {
      process.kill(-pid, signal);
      return;
    } catch {
      /* group gone */
    }
  }
  try {
    process.kill(pid, signal);
  } catch {
    /* gone */
  }
}

function pidsForSocketInodes(inodes) {
  const targets = new Set([...inodes].map((inode) => `socket:[${inode}]`));
  const pids = [];
  for (const entry of readdirSync("/proc")) {
    const pid = parsePid(entry);
    if (pid === null || pid === process.pid) continue;
    let fds;
    try {
      fds = readdirSync(`/proc/${pid}/fd`);
    } catch {
      continue;
    }
    for (const fd of fds) {
      try {
        if (targets.has(readlinkSync(`/proc/${pid}/fd/${fd}`))) {
          pids.push(pid);
          break;
        }
      } catch {
        /* fd closed */
      }
    }
  }
  return pids;
}

export function portOwners(port) {
  const inodes = new Set();
  for (const file of ["/proc/net/tcp", "/proc/net/tcp6"]) {
    let dump;
    try {
      dump = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const inode of parseListenerInodes(dump, port)) inodes.add(inode);
  }
  const pids = inodes.size > 0 ? pidsForSocketInodes(inodes) : [];
  return { pids, unattributed: inodes.size > 0 && pids.length === 0 };
}

export async function urlAnswers(url, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(2000) });
    return { ok: true, status: response.status };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

function readRunState(root = ROOT) {
  try {
    const parsed = JSON.parse(readFileSync(runStatePath(root), "utf8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRunState(state, root = ROOT) {
  const path = runStatePath(root);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
}

function resolveEvidenceDir(requested, root = ROOT) {
  const dir = resolve(requested || evidenceDirOf(root));
  const rootAbs = resolve(root);
  if (dir !== rootAbs && !dir.startsWith(`${rootAbs}/`)) {
    throw new Error(`evidence dir must be inside ${rootAbs}, got ${dir}`);
  }
  return dir;
}

export function ensureEvidenceDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function listEvidence(dir) {
  try {
    return readdirSync(dir)
      .filter((name) => !name.startsWith("."))
      .sort();
  } catch {
    return [];
  }
}

export async function launchBrowser() {
  return chromium.launch({ headless: true, args: CHROMIUM_ARGS });
}

export async function waitForReady(
  url,
  { timeoutMs = READY_MS, fetchImpl = fetch, now = Date.now } = {},
) {
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    const hit = await urlAnswers(url, fetchImpl);
    if (hit.ok) return hit;
    await sleep(250);
  }
  return { ok: false, error: `nothing answered on ${url} within ${Math.round(timeoutMs / 1000)}s` };
}

export async function cmdLaunch(opts) {
  const url = opts.url || DEFAULT_URL;
  const port = portFromUrl(url);
  const existing = await urlAnswers(url);
  if (existing.ok) {
    const state = {
      url,
      port,
      attached: true,
      startedPids: [],
      startedAt: new Date().toISOString(),
      evidenceDir: resolveEvidenceDir(opts.evidenceDir),
    };
    if (opts.dryRun) {
      return { ok: true, command: "launch", dryRun: true, would: "attach", url, port };
    }
    writeRunState(state);
    return { ok: true, command: "launch", attached: true, url, port, status: existing.status };
  }

  const owners = existsSync("/proc/self") ? portOwners(port) : { pids: [], unattributed: false };
  if (owners.pids.length > 0 || owners.unattributed) {
    return {
      ok: false,
      command: "launch",
      error: `port ${port} is held but ${url} does not answer`,
      pids: owners.pids,
    };
  }

  const command = ["npm", "run", "dev"];
  if (opts.dryRun) {
    return {
      ok: true,
      command: "launch",
      dryRun: true,
      would: "start",
      cwd: ROOT,
      argv: command,
      url,
    };
  }

  mkdirSync(join(ROOT, ".grok"), { recursive: true });
  const logPath = join(ROOT, DEV_LOG_REL);
  const log = openSync(logPath, "a");
  const child = spawn(command[0], command.slice(1), {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", log, log],
  });
  child.unref();

  let failure = null;
  child.on("error", (err) => {
    failure = `npm run dev could not be spawned: ${err.message}`;
  });
  child.on("exit", (code, signal) => {
    failure = `npm run dev exited early (${signal ?? `code ${code}`})`;
  });

  const ready = await waitForReady(url);
  if (!ready.ok || failure) {
    await terminatePids([child.pid].filter(Boolean), {
      kill: killPid,
      isAlive,
      sleep,
      graceMs: GRACE_MS,
      pollMs: POLL_MS,
    });
    return {
      ok: false,
      command: "launch",
      error: failure ?? ready.error,
      log: logPath,
    };
  }

  writeRunState({
    url,
    port,
    attached: false,
    startedPids: [child.pid],
    startedAt: new Date().toISOString(),
    evidenceDir: resolveEvidenceDir(opts.evidenceDir),
    log: logPath,
  });
  return { ok: true, command: "launch", attached: false, pid: child.pid, url, port, log: logPath };
}

export async function cmdDoctor(opts) {
  const url = opts.url || DEFAULT_URL;
  const port = portFromUrl(url);
  const checks = [];
  const push = (id, ok, detail) => {
    checks.push({ id, ok, ...detail });
  };

  const http = await urlAnswers(url);
  push("http", http.ok && (http.status ?? 500) < 400, http);

  let auth = { status: "indeterminate", message: "not probed" };
  try {
    const comparison = compareAuthInvariant({
      devAuthEnabled: await probeDevAuthEnabled(url),
      buildAuthEnabled: buildAuthEnabled(),
    });
    auth = comparison;
    push("auth-invariant", comparison.status !== "diverged", {
      status: comparison.status,
      message: comparison.message,
    });
  } catch (err) {
    push("auth-invariant", false, { error: String(err?.message || err) });
  }

  let playwrightOk = false;
  let pageDetail = {};
  try {
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors = { consoleErrors: [], pageErrors: [] };
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.pageErrors.push(String(err?.message || err)));
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForSelector('[data-active="true"]', { timeout: 15_000 });
      const title = await page.title();
      const activeId = await page.locator('[data-active="true"]').getAttribute("data-clip");
      const search = await page.getByRole("button", { name: "Search" }).count();
      pageDetail = {
        status: resp?.status() ?? 0,
        title,
        activeId,
        searchButtons: search,
        ...errors,
      };
      push("title", title === "Knock", { title });
      push("active-clip", Boolean(activeId), { activeId });
      push("search", search > 0, { searchButtons: search });
      playwrightOk = true;
    } finally {
      await browser.close();
    }
    push("playwright", true, { chromium: true });
  } catch (err) {
    push("playwright", false, { error: String(err?.message || err) });
    push("title", false, { skipped: true });
    push("active-clip", false, { skipped: true });
    push("search", false, { skipped: true });
  }

  const owners = existsSync("/proc/self") ? portOwners(port) : { pids: [], unattributed: false };
  push("port", owners.pids.length > 0 || http.ok, { port, pids: owners.pids });

  const ok = checks.every((c) => c.ok);
  return {
    ok,
    command: "doctor",
    url,
    auth,
    page: pageDetail,
    playwright: playwrightOk,
    checks,
  };
}

export async function cmdEvidence(opts) {
  const url = opts.url || DEFAULT_URL;
  const dir = resolveEvidenceDir(opts.evidenceDir);
  const kind = opts.kind || "screenshot";
  if (kind === "screenshot") {
    const png = join(dir, "screenshot.png");
    if (opts.dryRun) {
      return { ok: true, command: "evidence", dryRun: true, would: { kind, url, png } };
    }
    ensureEvidenceDir(dir);
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForSelector('[data-active="true"]', { timeout: 15_000 });
      await page.screenshot({ path: png, fullPage: false });
      return {
        ok: true,
        command: "evidence",
        kind,
        url,
        status: resp?.status() ?? 0,
        title: await page.title(),
        files: [png],
        evidenceDir: dir,
      };
    } finally {
      await browser.close();
    }
  }

  const png = join(dir, "verdict.png");
  const script = join(ROOT, "scripts/browser-smoke.mjs");
  if (opts.dryRun) {
    return {
      ok: true,
      command: "evidence",
      dryRun: true,
      would: { kind, url, argv: [process.execPath, script, url, png] },
    };
  }
  ensureEvidenceDir(dir);
  const result = await spawnJson(process.execPath, [script, url, png]);
  return {
    ok: result.code === 0 || result.code === 2,
    command: "evidence",
    kind,
    url,
    exitCode: result.code,
    verdict: result.json,
    files: [png, join(dir, "verdict-mobile.png"), join(dir, "verdict.json")],
    evidenceDir: dir,
    stderr: result.stderr || undefined,
  };
}

export async function cmdCleanup(opts) {
  const state = readRunState();
  const evidenceDir = state?.evidenceDir || resolveEvidenceDir(opts.evidenceDir);
  const pids = (state?.startedPids ?? []).filter((pid) => Number.isInteger(pid) && pid > 1);
  const live = pids.filter((pid) => isAlive(pid));
  if (opts.dryRun) {
    return {
      ok: true,
      command: "cleanup",
      dryRun: true,
      wouldSignal: live,
      wouldRemoveRunState: Boolean(state),
      evidencePreserved: listEvidence(evidenceDir),
      evidenceDir,
    };
  }

  const { signalled, stubborn } = await terminatePids(live, {
    kill: killPid,
    isAlive,
    sleep,
    graceMs: GRACE_MS,
    pollMs: POLL_MS,
  });
  rmSync(runStatePath(), { force: true });
  rmSync(join(ROOT, DEV_LOG_REL), { force: true });
  const leftover = stubborn.filter((pid) => isAlive(pid));
  const files = listEvidence(evidenceDir);
  return {
    ok: leftover.length === 0,
    command: "cleanup",
    signalled,
    stubborn: leftover,
    attached: Boolean(state?.attached) && live.length === 0,
    evidenceDir,
    evidence: files,
    error: leftover.length ? `pids still alive: ${leftover.join(", ")}` : undefined,
  };
}

export function spawnJson(cmd, args, { cwd = ROOT } = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (err) => {
      resolvePromise({ code: 1, json: null, stdout, stderr: String(err?.message || err) });
    });
    child.on("exit", (code) => {
      let json = null;
      try {
        json = JSON.parse(stdout);
      } catch {
        json = null;
      }
      resolvePromise({ code: code ?? 1, json, stdout, stderr });
    });
  });
}

async function cmdDrive(opts) {
  const url = opts.url || DEFAULT_URL;
  const dir = resolveEvidenceDir(opts.evidenceDir);
  ensureEvidenceDir(dir);
  const result = await driveFeature(opts.feature, {
    url,
    evidenceDir: dir,
    launchBrowser,
    spawnJson,
    root: ROOT,
  });
  return { command: "drive", evidenceDir: dir, ...result };
}

export async function dispatch(parsed) {
  switch (parsed.command) {
    case "help":
      return { ok: true, command: "help", text: helpText(parsed.helpTopic) };
    case "launch":
      return cmdLaunch(parsed);
    case "doctor":
      return cmdDoctor(parsed);
    case "drive":
      return cmdDrive(parsed);
    case "evidence":
      return cmdEvidence(parsed);
    case "cleanup":
      return cmdCleanup(parsed);
    default: {
      const _exhaustive = parsed.command;
      return { ok: false, error: `unhandled command: ${_exhaustive}` };
    }
  }
}

function printHelpAndExit(topic, code = 0) {
  const text = helpText(topic);
  if (code === 0) console.log(text);
  else console.error(text);
  process.exit(code);
}

async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.error) {
    console.error(JSON.stringify({ ok: false, error: parsed.error }, null, 2));
    process.exit(2);
  }
  if (parsed.command === "help") {
    printHelpAndExit(parsed.helpTopic, 0);
  }
  try {
    const result = await dispatch(parsed);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }, null, 2));
    process.exit(1);
  }
}

if (isMainModule(import.meta.url)) {
  await main(process.argv.slice(2));
}
