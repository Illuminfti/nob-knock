/**
 * VERIFICATION SCAFFOLDING — Playwright recipes for mapped Knock features.
 */
import { join } from "node:path";

export const FEATURE_IDS = [
  "for-you-feed",
  "search-clips",
  "like-and-login-gate",
  "following-receipts",
  "creator-profile",
];

export async function activeClipId(page) {
  return page.locator('[data-active="true"]').getAttribute("data-clip");
}

async function screenshot(page, dir, name) {
  const path = join(dir, name);
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function openFeed(page, url) {
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForSelector('[data-active="true"]', { timeout: 15_000 });
  return resp;
}

async function driveForYouFeed({ url, evidenceDir, launchBrowser, spawnJson, root }) {
  const browser = await launchBrowser();
  let beforeId = null;
  let afterId = null;
  let afterUrl = null;
  const files = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openFeed(page, url);
    beforeId = await activeClipId(page);
    files.push(await screenshot(page, evidenceDir, "for-you-feed-before.png"));
    // Phone viewport: same skip as scripts/feed-qa.mjs mobile. ArrowDown on a
    // focused .feed-scroll only nudges native scroll and may never change
    // data-clip; a full-height instant scroll is the user swipe.
    await page.locator(".feed-scroll").evaluate((element) => {
      element.scrollTo({ top: element.scrollTop + element.clientHeight, behavior: "instant" });
    });
    await page.waitForFunction(
      (id) => document.querySelector('[data-active="true"]')?.getAttribute("data-clip") !== id,
      beforeId,
      { timeout: 15_000 },
    );
    afterId = await activeClipId(page);
    afterUrl = page.url();
    files.push(await screenshot(page, evidenceDir, "for-you-feed-after.png"));
  } finally {
    await browser.close();
  }

  const qaPath = join(evidenceDir, "for-you-feed.json");
  const qa = await spawnJson(process.execPath, [join(root, "scripts/feed-qa.mjs"), url, qaPath]);
  files.push(qaPath);
  const qaFailures = qa.json?.failures ?? (qa.code === 0 ? [] : ["feed-qa exited non-zero"]);
  const skipped = Boolean(beforeId) && Boolean(afterId) && beforeId !== afterId;
  const urlTracks = (() => {
    try {
      return new URL(afterUrl).searchParams.get("c") === afterId;
    } catch {
      return false;
    }
  })();
  const ok = skipped && urlTracks && qaFailures.length === 0;
  return {
    ok,
    feature: "for-you-feed",
    beforeId,
    afterId,
    afterUrl,
    urlTracks,
    qaExitCode: qa.code,
    qaFailures,
    files,
    error: ok
      ? undefined
      : `skip=${skipped} urlTracks=${urlTracks} qa=${qaFailures.join("; ") || qa.code}`,
  };
}

async function driveSearchClips({ url, evidenceDir, launchBrowser }) {
  const browser = await launchBrowser();
  const files = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openFeed(page, url);
    await page.getByRole("button", { name: "Search" }).click();
    const dialog = page.getByRole("dialog", { name: "Purpose of visit?" });
    await dialog.waitFor({ state: "visible", timeout: 8_000 });
    const field = page.getByLabel("Search clips");
    await field.fill("cold email");
    await page.getByRole("button", { name: /Cold email/i }).waitFor({ timeout: 5_000 });
    files.push(await screenshot(page, evidenceDir, "search-clips-before.png"));
    await field.fill("volcano");
    await page.getByText("No receipts match.").waitFor({ timeout: 5_000 });
    await field.fill("unsubscribe");
    await page.getByRole("button", { name: /Lifehacker/i }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-active="true"]')?.getAttribute("data-clip") === "unsubscribe",
      null,
      { timeout: 8_000 },
    );
    const afterId = await activeClipId(page);
    const afterUrl = page.url();
    files.push(await screenshot(page, evidenceDir, "search-clips-after.png"));
    const ok =
      afterId === "unsubscribe" && new URL(afterUrl).searchParams.get("c") === "unsubscribe";
    return {
      ok,
      feature: "search-clips",
      afterId,
      afterUrl,
      files,
      error: ok ? undefined : `expected unsubscribe, got ${afterId} ${afterUrl}`,
    };
  } finally {
    await browser.close();
  }
}

async function driveLikeAndLoginGate({ url, evidenceDir, launchBrowser }) {
  const browser = await launchBrowser();
  const files = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openFeed(page, url);
    const fromClip = await activeClipId(page);
    files.push(await screenshot(page, evidenceDir, "like-and-login-gate-before.png"));
    await page.locator('[data-active="true"]').getByRole("button", { name: "Like" }).click();
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    const body = await page.locator("body").innerText();
    const continueX = (await page.getByRole("button", { name: "Continue with X" }).count()) > 0;
    const held = body.includes("Sign-in is held at the door.");
    const receipts = body.includes("Receipts ready.");
    files.push(await screenshot(page, evidenceDir, "like-and-login-gate-after.png"));
    const loginUrl = new URL(page.url());
    const ok =
      receipts && loginUrl.pathname === "/login" && loginUrl.searchParams.get("c") === fromClip;
    return {
      ok,
      feature: "like-and-login-gate",
      fromClip,
      loginPath: `${loginUrl.pathname}${loginUrl.search}`,
      continueWithX: continueX,
      signInHeld: held,
      files,
      error: ok ? undefined : `login gate failed path=${loginUrl.href} receipts=${receipts}`,
    };
  } finally {
    await browser.close();
  }
}

async function driveFollowingReceipts({ url, evidenceDir, launchBrowser }) {
  const browser = await launchBrowser();
  const files = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openFeed(page, url);
    files.push(await screenshot(page, evidenceDir, "following-receipts-before.png"));
    await page.locator('[data-tab="following"]').click();
    await page.getByText("No receipts.").waitFor({ timeout: 8_000 });
    const body = await page.locator("body").innerText();
    files.push(await screenshot(page, evidenceDir, "following-receipts-after.png"));
    const signedOutCopy = body.includes("Sign in with X, then like a clip.");
    const signedInCopy = body.includes("Like a clip on For You. We will keep it on file.");
    const ok = signedOutCopy || signedInCopy;
    return {
      ok,
      feature: "following-receipts",
      empty: true,
      signedOutCopy,
      signedInCopy,
      files,
      error: ok ? undefined : "Following empty copy missing",
    };
  } finally {
    await browser.close();
  }
}

async function driveCreatorProfile({ url, evidenceDir, launchBrowser }) {
  const browser = await launchBrowser();
  const files = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openFeed(page, url);
    await page
      .locator('[data-active="true"]')
      .getByRole("button", { name: "Mike Hawk profile" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Mike Hawk profile" });
    await dialog.waitFor({ state: "visible", timeout: 8_000 });
    const sheetText = await dialog.innerText();
    files.push(await screenshot(page, evidenceDir, "creator-profile-before.png"));
    await page.getByRole("button", { name: "Play Lifehacker" }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-active="true"]')?.getAttribute("data-clip") === "unsubscribe",
      null,
      { timeout: 8_000 },
    );
    const afterId = await activeClipId(page);
    files.push(await screenshot(page, evidenceDir, "creator-profile-after.png"));
    const ok =
      sheetText.includes("@mikehawk") &&
      sheetText.includes("20 clips on file") &&
      afterId === "unsubscribe";
    return {
      ok,
      feature: "creator-profile",
      afterId,
      afterUrl: page.url(),
      files,
      error: ok ? undefined : `profile jump failed afterId=${afterId}`,
    };
  } finally {
    await browser.close();
  }
}

const DRIVERS = {
  "for-you-feed": driveForYouFeed,
  "search-clips": driveSearchClips,
  "like-and-login-gate": driveLikeAndLoginGate,
  "following-receipts": driveFollowingReceipts,
  "creator-profile": driveCreatorProfile,
};

export async function driveFeature(id, ctx) {
  const driver = DRIVERS[id];
  if (!driver) return { ok: false, feature: id, error: `no driver for ${id}` };
  try {
    return await driver(ctx);
  } catch (err) {
    return { ok: false, feature: id, error: String(err?.message || err) };
  }
}
