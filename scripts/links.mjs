// Resolves each indicator's official methodology PDF from the UN SDG metadata repository and checks that it opens.
// The target page lists the real file names (some carry an "a" or "b" suffix), so nothing is guessed.
import { readFileSync, writeFileSync } from "node:fs";

const registry = JSON.parse(readFileSync("data/registry.json", "utf8"));
const meta = JSON.parse(readFileSync("data/sdg-meta.json", "utf8"));
const ver = JSON.parse(readFileSync("data/verification.json", "utf8"));
const pad = (n) => String(n).padStart(2, "0");
const status = async (u) => { try { const r = await fetch(u, { method: "HEAD", redirect: "follow" }); return r.status; } catch { return "error"; } };

const out = {};
for (const ind of registry.indicators) {
  const m = meta.indicators[ind.id];
  if (!m?.indicator) { out[ind.id] = { url: ind.metaUrl, status: await status(ind.metaUrl) }; continue; }
  const [g, t, i] = m.indicator.split(".");
  const page = `https://unstats.un.org/sdgs/metadata/?Text=&Goal=${g}&Target=${m.target}`;
  const html = await (await fetch(page)).text();
  const want = `Metadata-${pad(g)}-${pad(t)}-${pad(i)}`;
  const file = [...html.matchAll(/files\/(Metadata-[0-9A-Za-z-]+\.pdf)/g)].map((x) => x[1]).find((f) => f.startsWith(want));
  const url = file ? `https://unstats.un.org/sdgs/metadata/files/${file}` : page;
  out[ind.id] = { url, status: await status(url), listing: page };
  m.metaUrl = url;
  console.log(ind.id.padEnd(28), out[ind.id].status, url);
}
ver.metadataLinks = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { url: v.url, status: v.status }]));
writeFileSync("data/sdg-meta.json", JSON.stringify(meta, null, 1));
writeFileSync("data/verification.json", JSON.stringify(ver, null, 1));
