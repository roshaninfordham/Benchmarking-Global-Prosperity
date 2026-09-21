// Records a narrated walkthrough of the live platform.
// Each narration line has a measured duration; the on-screen actions for that line run inside that window,
// and the start time of every line is written to marks.json so the audio can be placed exactly.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";

const BASE = process.env.BASE ?? "https://benchmarking-global-prosperity.vercel.app";
const START = `${BASE}/?c=KEN&vs=USA,g:EasternAfrica&i=under-five-mortality&v=overview&lang=en`;
const dur = JSON.parse(readFileSync("audio/durations.json", "utf8"));
const caps = JSON.parse(readFileSync("captions.json", "utf8"));
const W = 1440, H = 810, GAP = 0.6;
const EXTRA = { l8: 1.5 }; // hold on the India globe a little longer
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

rmSync("raw", { recursive: true, force: true }); mkdirSync("raw");
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--hide-scrollbars"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1920 / W, colorScheme: "light", recordVideo: { dir: "raw", size: { width: 1920, height: 1080 } } });

// Injected on every page: a visible cursor with click ripples, a caption bar and full-screen title/end cards.
await ctx.addInitScript(() => {
  try { if (!localStorage.getItem("bgp-theme")) localStorage.setItem("bgp-theme", "light"); if (!localStorage.getItem("bgp-lang")) localStorage.setItem("bgp-lang", "en"); } catch {}
  const build = () => {
  const root = document.documentElement;
  const st = document.createElement("style");
  st.textContent = `
  #__cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:30px;height:30px;transform:translate(-200px,-200px);filter:drop-shadow(0 3px 5px rgba(0,0,0,.45))}
  .__rip{position:fixed;z-index:2147483646;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid #3987e5;pointer-events:none;animation:__rip .65s ease-out forwards}
  @keyframes __rip{to{transform:scale(4.5);opacity:0}}
  #__cap{position:fixed;z-index:2147483645;left:50%;bottom:30px;transform:translateX(-50%);max-width:1120px;padding:13px 26px;border-radius:14px;background:rgba(7,17,28,.88);color:#fff;font:500 25px/1.35 var(--font-plex,system-ui,sans-serif);text-align:center;opacity:0;transition:opacity .3s;backdrop-filter:blur(6px);box-shadow:0 10px 30px rgba(0,0,0,.35)}
  #__cap.on{opacity:1}
  #__card{position:fixed;inset:0;z-index:2147483644;display:grid;place-content:center;justify-items:center;gap:22px;text-align:center;background:#07111c;color:#eaf1f8;opacity:0;pointer-events:none;transition:opacity .8s ease;font-family:var(--font-plex,system-ui,sans-serif)}
  #__card.on{opacity:1}
  #__card h1{font:700 74px/1 var(--font-plex-cond,var(--font-plex,system-ui));letter-spacing:-.02em;margin:0}
  #__card p{font-size:27px;color:#a9b7c6;margin:0}
  #__card .by{display:flex;align-items:center;gap:14px;margin-top:34px;color:#a9b7c6;font-size:22px}
  #__card .by img{width:46px;height:auto}
  #__card .url{font-size:26px;color:#86b6ef;margin-top:6px}
  #__card svg{color:#3987e5;filter:drop-shadow(0 0 18px rgba(57,135,229,.7))}`;
  root.appendChild(st);
  const cur = document.createElement("div"); cur.id = "__cur";
  cur.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 2l15 9-6.5 1.6L9.6 19z" fill="#fff" stroke="#0c1a2b" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const cap = document.createElement("div"); cap.id = "__cap";
  const card = document.createElement("div"); card.id = "__card";
  card.innerHTML = '<svg viewBox="0 0 32 32" width="84" height="84" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="16" cy="16" r="12.5"/><ellipse cx="16" cy="16" rx="5.2" ry="12.5" opacity=".55"/><path d="M4 16h24M6.5 9.5h19M6.5 22.5h19" opacity=".35"/><circle cx="20.6" cy="11.2" r="2.6" fill="currentColor" stroke="none"/></svg><h1>Benchmarking Global Prosperity</h1><p>From data to insight, evidence and progress</p><div class="by"><img src="/brand/un-logo.png" alt=""><span>Built on the UN System Data Commons</span></div><div class="url" id="__url" style="display:none">benchmarking-global-prosperity.vercel.app</div>';
  root.append(cur, cap, card);
  if (location.search.includes("__t=1")) { card.style.transition = "none"; card.classList.add("on"); requestAnimationFrame(() => (card.style.transition = "")); }
  window.__card = (on, end) => { document.getElementById("__url").style.display = end ? "block" : "none"; card.classList.toggle("on", on); };
  window.__cap = (txt) => { const c = document.getElementById("__cap"); if (!txt || !txt.trim()) return c.classList.remove("on"); c.textContent = txt; c.classList.add("on"); };
  addEventListener("mousemove", (e) => { cur.style.transform = `translate(${e.clientX - 5}px,${e.clientY - 3}px)`; }, true);
  addEventListener("mousedown", (e) => { const r = document.createElement("div"); r.className = "__rip"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; root.appendChild(r); setTimeout(() => r.remove(), 700); }, true);
  };
  // The document element may not exist yet when this runs, so wait for it.
  if (document.documentElement) build();
  else { const mo = new MutationObserver(() => { if (document.documentElement) { mo.disconnect(); build(); } }); mo.observe(document, { childList: true }); }
});

const t0 = Date.now();
const page = await ctx.newPage();
page.setDefaultTimeout(5000);
let pos = { x: W / 2, y: H / 2 };
const marks = {};
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 160)));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 160)); });
const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6), ...a);

// --- helpers
async function glide(x, y, ms = 900) {
  const { x: x0, y: y0 } = pos, t1 = Date.now();
  for (;;) { // progress follows the clock, so the move takes exactly `ms` however slow each mouse call is
    const k = Math.min(1, (Date.now() - t1) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await page.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e);
    if (k >= 1) break;
    await sleep(8);
  }
  pos = { x, y };
}
async function centre(sel, fx = 0.5, fy = 0.5) { const b = await page.locator(sel).first().boundingBox(); return b && { x: b.x + b.width * fx, y: b.y + b.height * fy }; }
async function hover(sel, ms = 900, fx = 0.5, fy = 0.5) { const p = await centre(sel, fx, fy); if (p) await glide(p.x, p.y, ms); }
async function click(sel, ms = 900) { await hover(sel, ms); await sleep(180); await page.mouse.down(); await sleep(70); await page.mouse.up(); await sleep(250); }
async function scrollTo(sel, offset = 90) { await page.evaluate(([s, o]) => window.scrollTo({ top: document.querySelector(s).getBoundingClientRect().top + scrollY - o, behavior: "smooth" }), [sel, offset]); await sleep(900); }
async function scrollY(y) { await page.evaluate((v) => window.scrollTo({ top: v, behavior: "smooth" }), y); await sleep(1100); }
async function pick(trigger, text, name, m1 = 900, m2 = 700) {
  await click(trigger, m1); await sleep(200); await page.keyboard.type(text, { delay: 100 }); await sleep(350);
  await click(`.combo-option:has(span:text-is("${name}"))`, m2);
}
async function tab(name) { await click(`.tabs button:has-text("${name}")`, 550); }
async function captions(id, seconds) {
  const parts = caps[id], total = parts.join("").length;
  const set = async (t) => { for (let i = 0; i < 6; i++) { try { await page.evaluate((x) => window.__cap(x), t); return; } catch { await sleep(300); } } }; // the page can be mid-navigation
  for (const p of parts) { await set(p); await sleep((p.length / total) * (seconds - 0.4) * 1000); }
  await set("");
}
async function segment(id, actions) {
  marks[id] = (Date.now() - t0) / 1000; log("start", id);
  const seconds = dur[id] + GAP + (EXTRA[id] ?? 0);
  await Promise.all([captions(id, dur[id] + 0.1), actions().catch((e) => log("action error in", id, e.message)), sleep(seconds * 1000)]);
}

// --- the walkthrough
await page.goto(START + "&__t=1", { waitUntil: "load" });
await page.waitForSelector(".who"); await page.evaluate(() => document.fonts.ready);
marks.first = (Date.now() - t0) / 1000; // the title card is on screen from here

await segment("l1", async () => {
  await sleep((dur.l1 - 2.6) * 1000);
  await page.goto(START + "&__t=1", { waitUntil: "load" }); // reload behind the card so the globe's spin-in plays as the card lifts
  await page.waitForSelector(".who"); await page.waitForFunction(() => typeof window.__card === "function", null, { timeout: 8000 }); await sleep(500);
  await page.evaluate(() => window.__card(false));
});

await segment("l2", async () => {
  await sleep(900);
  await pick(".topbar .pick", "ken", "Kenya");
  await scrollTo("#h-viz");
  await hover(".icard", 900); await sleep(500);
  await hover(".icard:nth-of-type(3)", 900);
});

await segment("l3", async () => {
  await scrollY(0);
  await hover(".block:nth-child(1) .finding", 1000); await sleep(1500);
  await hover(".block:nth-child(2) .finding", 1100); await sleep(1200);
  await hover(".block:nth-child(2) li:nth-child(3) .finding", 700);
});

await segment("l4", async () => {
  await click(".pick-ghost", 900);   // the list opens with UN regions first, then countries
  await sleep(1300);
  await page.keyboard.type("brazil", { delay: 120 }); await sleep(500);
  await click('.combo-option:has(span:text-is("Brazil"))', 700);
});

await segment("l5", async () => {
  await scrollTo("#h-viz");
  await tab("Baseline");
  await sleep(1000); await scrollY((await page.evaluate(() => scrollY)) + 380); await scrollTo("#h-viz");
});

await segment("l6", async () => {
  await tab("Compare"); await sleep(1200);
  await hover(".bars .crow:nth-child(4) .cbar", 900);
});

await segment("l7", async () => {
  await tab("Trend"); await sleep(1500);
  const b = await page.locator(".tplot svg").first().boundingBox();
  await glide(b.x + b.width * 0.25, b.y + b.height * 0.5, 700);
  await glide(b.x + b.width * 0.72, b.y + b.height * 0.5, 2600);
});

await segment("l8", async () => {
  await tab("Map");
  await scrollTo(".mapview", 88);   // bring the whole globe into frame
  const c = await centre(".map-stage canvas");
  await glide(c.x - 60, c.y, 350); await page.mouse.down(); await glide(c.x + 100, c.y - 20, 700); await page.mouse.up();
  await pick(".topbar .pick", "ind", "India", 600, 500);   // the globe turns to India
  await sleep(500);
  const c2 = await centre(".map-stage canvas"); await glide(c2.x, c2.y, 700);
});

await segment("l9", async () => {
  await scrollTo("#h-ev");
  await hover(".ev-table tbody tr", 1000); await sleep(1500);
  await hover(".ev-table .ext-s", 1000);
});

await segment("l10", async () => {
  await scrollTo("#h-viz");
  await tab("Compare");
  await click('.inav-item:has-text("Undernourishment")', 700); await sleep(700);
  await hover(".bars .crow:nth-child(4) .cbar", 700); await sleep(600);
  await scrollTo("#h-ev");
  await hover(".ev-table tbody tr:nth-child(2)", 800);
});

await segment("l11", async () => {
  await click('a[href="/verification"]', 800);
  await page.waitForSelector(".vstats"); await sleep(4200);
  await scrollY(420);
});

await segment("l12", async () => {
  await page.goto(`${BASE}/?c=KEN&vs=USA,g:EasternAfrica&i=under-five-mortality&v=overview&lang=ar`, { waitUntil: "load" });
  await page.waitForSelector(".who"); await sleep(1400);
  await click(".theme-toggle", 900);
});

await segment("l13", async () => {
  await page.evaluate(() => window.__card(true, true));
});
await sleep(2200);
marks.end = (Date.now() - t0) / 1000;

const video = page.video();
await ctx.close();
const path = await video.path();
writeFileSync("marks.json", JSON.stringify({ marks, video: path }, null, 1));
await browser.close();
log("done", path);
