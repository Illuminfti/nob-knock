#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8081/";
const output = process.argv[3] || "/workspace/screenshots/feed-qa.json";
const cases = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

mkdirSync(dirname(output), { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const report = { url, cases: {}, failures: [] };

try {
  for (const spec of cases) {
    const context = await browser.newContext({
      viewport: spec.viewport,
      isMobile: spec.isMobile,
      hasTouch: spec.hasTouch,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(String(error?.message || error)));

    await page.addInitScript(() => {
      window.__knockMetrics = { cls: 0, longTasks: [] };
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__knockMetrics.cls += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch {
        // This browser does not expose that PerformanceObserver entry type.
      }
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__knockMetrics.longTasks.push(Math.round(entry.duration));
          }
        }).observe({ type: "longtask", buffered: true });
      } catch {
        // This browser does not expose that PerformanceObserver entry type.
      }
    });

    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForSelector('[data-active="true"]', { timeout: 15_000 });
    await page.waitForTimeout(900);

    const sample = async () =>
      page.evaluate(() => {
        const active = document.querySelector('[data-active="true"]');
        const videos = [...document.querySelectorAll("video")];
        const root = document.documentElement;
        const resources = performance
          .getEntriesByType("resource")
          .filter((entry) => entry.name.includes("/clips/"));
        return {
          activeId: active?.getAttribute("data-clip") || null,
          videoCount: videos.length,
          playingVideos: videos.filter((video) => !video.paused && !video.ended).length,
          horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
          domNodes: document.querySelectorAll("*").length,
          clipRequests: resources.length,
          url: location.href,
        };
      });

    const initial = await sample();
    const observed = [initial];
    for (let step = 0; step < 3; step += 1) {
      const previousId = observed.at(-1).activeId;
      if (spec.isMobile) {
        await page.locator(".feed-scroll").evaluate((element) => {
          element.scrollTo({ top: element.scrollTop + element.clientHeight, behavior: "instant" });
        });
      } else {
        await page.keyboard.press("ArrowDown");
      }
      await page.waitForFunction(
        (id) => document.querySelector('[data-active="true"]')?.getAttribute("data-clip") !== id,
        previousId,
        { timeout: 8_000 },
      );
      await page.waitForTimeout(350);
      observed.push(await sample());
    }

    const final = observed.at(-1);
    const currentParam = new URL(final.url).searchParams.get("c");
    const assertions = {
      status200: response?.status() === 200,
      activeChanged: new Set(observed.map((entry) => entry.activeId)).size === observed.length,
      maxThreePlayers: Math.max(...observed.map((entry) => entry.videoCount)) <= 3,
      atMostOnePlaying: Math.max(...observed.map((entry) => entry.playingVideos)) <= 1,
      noHorizontalOverflow: observed.every((entry) => !entry.horizontalOverflow),
      urlTracksActive: currentParam === final.activeId,
      noConsoleErrors: consoleErrors.length === 0,
      noPageErrors: pageErrors.length === 0,
    };
    const metrics = await page.evaluate(() => window.__knockMetrics || null);
    report.cases[spec.name] = { assertions, observed, metrics, consoleErrors, pageErrors };
    for (const [name, passed] of Object.entries(assertions)) {
      if (!passed) report.failures.push(`${spec.name}: ${name}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exitCode = 1;
