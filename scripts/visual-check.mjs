/**
 * Looks at the Studio instead of trusting that HTTP 200 means it renders.
 *
 * This exists because a QR code shipped at 320px inside a 200px box and
 * covered half the partner page — a defect invisible to every check that was
 * being run, all of which asked the server for a status code and grepped the
 * HTML for words. A person opened the page and saw it immediately.
 *
 * Per page: does the document scroll sideways, is anything drawn larger than
 * the box it sits in that cannot be scrolled to, and did the browser log an
 * error. That last one was added after a hydration mismatch sat red in the
 * console of the partner page while this script reported it clean — layout is
 * only half of what "it renders" means. Screenshots are written too, because
 * some things only a pair of eyes will catch.
 *
 *   npm run check:visual                    # against localhost:3000
 *   BASE=https://tripsfactory.com npm run check:visual
 *   PAGES=/studio/leads npm run check:visual
 *
 * Exits non-zero when it finds something, so it can gate a deploy.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "./shots";
mkdirSync(OUT, { recursive: true });

const PAGES = process.env.PAGES
  ? process.env.PAGES.split(",")
  : [
      "/studio/partners",
      "/studio/partners/1",
      "/studio/partners/print",
      "/studio/leads",
      "/studio/masterclasses",
      "/studio/users",
      "/studio/content",
    ];

async function signIn(page, BASE) {
  await page.goto(`${BASE}/studio/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "admin@tripsfactory.uz");
  await page.fill('input[type="password"]', "trips-admin");
  // The submit button is disabled until the form hydrates; waiting for it is
  // what stops this from racing the page and submitting plain HTML.
  await page.waitForSelector('button[type="submit"]:not([disabled])', {
    timeout: 20000,
  });
  await Promise.all([
    // Away from the login page — not merely "a /studio URL", which the login
    // page itself satisfies. That mistake made the whole check pass against
    // screenshots of the login form.
    page.waitForURL((u) => !u.pathname.startsWith("/studio/login"), {
      timeout: 20000,
    }),
    page.click('button[type="submit"]'),
  ]);
  if (page.url().includes("/studio/login")) throw new Error("login failed");
}

const browser = await chromium.launch();
const problems = [];

for (const width of [1440, 390]) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  /** Console noise is per page; collected here, read after each navigation. */
  let logged = [];
  const note = (text) => {
    const first = String(text).split("\n")[0].trim();
    // Chrome's own advice lines and the dev overlay are not the app's fault.
    if (/DevTools|Download the React DevTools|\[Fast Refresh\]/i.test(first)) return;
    logged.push(first.slice(0, 200));
  };
  page.on("pageerror", (e) => note(e));
  page.on("console", (m) => {
    if (m.type() === "error") note(m.text());
  });

  /**
   * Media lives in R2 in production and is not copied into the local
   * miniflare bucket, so image previews 404 against localhost and nowhere
   * else. Reported as a note rather than a failure — a check that cries wolf
   * on every local run is a check people stop reading — but never hidden.
   */
  const localMedia = new Set();
  page.on("response", (r) => {
    if (r.status() === 404 && /\/api\/media\/file\//.test(r.url())) {
      localMedia.add(r.url().split("/").pop());
    }
  });
  const isLocal = /localhost|127\.0\.0\.1/.test(BASE);

  await signIn(page, BASE);

  for (const path of PAGES) {
    logged = [];
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900); // QR codes are drawn after mount

    const name = path.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "root";
    await page.screenshot({
      path: `${OUT}/${width}-${name}.png`,
      fullPage: true,
    });

    const report = await page.evaluate(() => {
      const out = { overflow: [], oversized: [] };
      const docWidth = document.documentElement.clientWidth;

      if (document.documentElement.scrollWidth > docWidth + 1) {
        out.overflow.push({
          what: "page",
          scroll: document.documentElement.scrollWidth,
          view: docWidth,
        });
      }

      // Content wider than a container it cannot be scrolled out of. A table
      // inside overflow-x:auto is meant to be wider than its box — that is
      // what the scrollbar is for — so anything with a scrollable ancestor is
      // not a fault.
      const scrollable = (el) => {
        for (let n = el.parentElement; n; n = n.parentElement) {
          const o = getComputedStyle(n).overflowX;
          if (o === "auto" || o === "scroll") return true;
        }
        return false;
      };

      for (const el of document.querySelectorAll("main *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const parent = el.parentElement;
        if (!parent) continue;
        if (scrollable(el)) continue;
        const p = parent.getBoundingClientRect();
        const spillsRight = r.right > docWidth + 1;
        const biggerThanParent = r.width > p.width + 2 || r.height > p.height + 2;
        if (spillsRight || biggerThanParent) {
          out.oversized.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.baseVal ?? el.className ?? "")
              .toString()
              .slice(0, 40),
            box: [Math.round(r.width), Math.round(r.height)],
            parent: [Math.round(p.width), Math.round(p.height)],
            spillsRight,
          });
        }
      }
      out.oversized = out.oversized.slice(0, 6);
      return out;
    });

    const consoleErrors = [...new Set(logged)].filter(
      (e) =>
        !(
          isLocal &&
          localMedia.size > 0 &&
          /Failed to load resource.*404/i.test(e)
        ),
    );
    if (isLocal && localMedia.size) {
      console.log(
        `        note: ${localMedia.size} media file(s) not in the local R2 bucket (${[...localMedia].slice(0, 2).join(", ")}) — expected off production`,
      );
      localMedia.clear();
    }
    const bad =
      report.overflow.length || report.oversized.length || consoleErrors.length;
    console.log(
      `${bad ? "✗" : "✓"} ${String(width).padStart(4)}px  ${path}` +
        (report.overflow.length
          ? `  — page scrolls sideways (${report.overflow[0].scroll} > ${report.overflow[0].view})`
          : ""),
    );
    for (const o of report.oversized) {
      console.log(
        `        ${o.tag}.${o.cls} ${o.box.join("×")} inside ${o.parent.join("×")}${o.spillsRight ? " — past the right edge" : ""}`,
      );
    }
    for (const e of consoleErrors) console.log(`        console: ${e}`);
    if (bad) problems.push(`${width}px ${path}`);
  }
  await ctx.close();
}

await browser.close();
console.log(
  problems.length ? `\nPROBLEMS: ${problems.join(", ")}` : "\nno layout problems found",
);
console.log(`screenshots in ${OUT}`);
process.exit(problems.length ? 1 : 0);
