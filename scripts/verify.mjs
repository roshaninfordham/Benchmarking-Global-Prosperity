// Independent verification of the snapshot against the official sources, plus cited metadata.
//  - SDG series: every snapshot observation is looked up in the UN SDG Global Database API
//    (https://unstats.un.org/sdgapi/v1/sdg) and compared by country, year and value.
//  - Life expectancy: compared with the UNDP HDRO composite-indices time series (CSV).
//  - Registry links: each methodology URL is requested and its status recorded.
// Writes data/sdg-meta.json (cited metadata used by the app) and data/verification.json (results).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { sleep } from "./mcp.mjs";

const iso = createRequire(import.meta.url)("i18n-iso-countries");
const API = "https://unstats.un.org/sdgapi/v1/sdg";
const HDRO_CSV = "https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv";
const registry = JSON.parse(readFileSync("data/registry.json", "utf8"));

async function getJson(url, tries = 4) {
  for (let i = 0; ; i++) {
    try { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
    catch (e) { if (i >= tries) throw new Error(`${url}: ${e.message}`); await sleep(1000 * 2 ** i); }
  }
}
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Official goal, target and indicator text.
const goals = await getJson(`${API}/Goal/List?includechildren=true`);
const targets = {}, indicators = {};
for (const g of goals) for (const t of g.targets ?? []) { targets[t.code] = t.description; for (const i of t.indicators ?? []) indicators[i.code] = i.description; }
const seriesList = Object.fromEntries((await getJson(`${API}/Series/List`)).map((s) => [s.code, s]));

const meta = {}, results = {};
const sdgInds = registry.indicators.filter((i) => i.dcid.startsWith("undata/sdg/"));
for (const ind of sdgInds) {
  const [code, ...dimParts] = ind.dcid.split("/")[2].split(".");
  const want = {};
  for (const part of (dimParts.join(".") || "").split("__").filter(Boolean)) { const [k, v] = part.split("--"); want[norm(k)] = v; }
  const snap = JSON.parse(readFileSync(`data/snapshot/${ind.id}.json`, "utf8"));
  const isos = Object.keys(snap.obs).filter((c) => iso.alpha3ToNumeric(c));
  const rows = [];
  let dimCodes = {};
  for (let i = 0; i < isos.length; i += 40) {
    const q = isos.slice(i, i + 40).map((c) => `areaCode=${Number(iso.alpha3ToNumeric(c))}`).join("&");
    const page = await getJson(`${API}/Series/Data?seriesCode=${code}&${q}&pageSize=100000`);
    rows.push(...page.data);
    for (const d of page.dimensions ?? []) dimCodes[d.id] = { ...(dimCodes[d.id] ?? {}), ...Object.fromEntries(d.codes.map((c) => [c.code, c.sdmx])) };
    await sleep(300);
  }
  const sdmx = (dim, c) => dimCodes[dim]?.[c] ?? c;
  // A row belongs to this variable if every dimension matches the graph variable, or is a total where the variable leaves it open.
  const pick = rows.filter((r) => Object.entries(r.dimensions).every(([d, c]) => {
    if (d === "Reporting Type") return true;
    const w = want[norm(d)];
    return w !== undefined ? sdmx(d, c) === w : sdmx(d, c) === "_T";
  }));
  const byKey = new Map();
  for (const r of pick) { const k = `${String(r.geoAreaCode).padStart(3, "0")}:${Math.trunc(r.timePeriodStart)}`; (byKey.get(k) ?? byKey.set(k, []).get(k)).push(r); }

  let checked = 0, matched = 0, missing = 0; const mismatches = [];
  const nature = {}, sources = {};
  for (const c of isos) {
    const num = String(iso.alpha3ToNumeric(c)).padStart(3, "0");
    for (const [year, value] of snap.obs[c]) {
      checked++;
      const cands = byKey.get(`${num}:${year}`);
      if (!cands) { missing++; continue; }
      const hit = cands.find((r) => Math.abs(Number(r.value) - value) <= 1e-6 * Math.max(1, Math.abs(value)));
      if (hit) matched++; else if (mismatches.length < 5) mismatches.push({ c, year, graph: value, sdg: cands.map((r) => r.value) });
    }
    const last = snap.obs[c].at(-1);
    const hit = last && byKey.get(`${num}:${last[0]}`)?.[0];
    if (hit) { nature[hit.attributes?.Nature ?? "NA"] = (nature[hit.attributes?.Nature ?? "NA"] ?? 0) + 1; sources[hit.source] = (sources[hit.source] ?? 0) + 1; }
  }
  const natureDesc = {};
  const sample = await getJson(`${API}/Series/Data?seriesCode=${code}&areaCode=404&pageSize=1`);
  for (const a of sample.attributes ?? []) if (a.id === "Nature") for (const c of a.codes) natureDesc[c.code] = c.description;
  const unitsDesc = (sample.attributes ?? []).find((a) => a.id === "Units")?.codes?.[0]?.description;
  const s = seriesList[code];
  meta[ind.id] = {
    series: code, seriesDescription: s?.description, release: s?.release,
    goal: s?.goal?.[0], target: s?.target?.[0], indicator: s?.indicator?.[0],
    targetText: targets[s?.target?.[0]], indicatorTitle: indicators[s?.indicator?.[0]],
    units: unitsDesc,
    sources: Object.entries(sources).sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n })),
    nature: Object.entries(nature).sort((a, b) => b[1] - a[1]).map(([code, n]) => ({ code, label: natureDesc[code] ?? code, n })),
    dataUrl: `${API}/Series/Data?seriesCode=${code}`, listUrl: `${API}/Series/List`,
  };
  results[ind.id] = { source: "UN SDG Global Database API", checked, matched, missingInApi: missing, mismatched: checked - matched - missing, matchRate: +(matched / checked).toFixed(4), examples: mismatches };
  console.log(`${ind.id.padEnd(28)} ${matched}/${checked} match  missing ${missing}  mismatched ${checked - matched - missing}`);
}

// Guard the numeric targets shown in charts against the official target text.
for (const ind of registry.indicators) if (ind.targetValue !== undefined) {
  const text = meta[ind.id]?.targetText ?? "";
  if (!text.includes(String(ind.targetValue))) throw new Error(`Target ${ind.targetValue} for ${ind.id} not found in official target text: ${text}`);
}

// Life expectancy against UNDP's published time series.
const le = registry.indicators.find((i) => i.dcid === "undata/undphdro/HDI_le");
if (le) {
  const csv = (await (await fetch(HDRO_CSV)).text()).split(/\r?\n/);
  const head = csv[0].split(",").map((h) => h.replace(/^﻿|"/g, ""));
  const ix = Object.fromEntries(head.map((h, i) => [h, i]));
  const table = {};
  for (const line of csv.slice(1)) { if (!line) continue; const c = line.split(","); (table[c[ix.iso3]?.replace(/"/g, "")] ??= {})[0] = c; }
  const snap = JSON.parse(readFileSync(`data/snapshot/${le.id}.json`, "utf8"));
  let checked = 0, matched = 0, missing = 0; const ex = [];
  for (const [c, series] of Object.entries(snap.obs)) for (const [y, v] of series) {
    checked++;
    const row = table[c]?.[0], cell = row?.[ix[`le_${y}`]];
    if (cell === undefined || cell === "") { missing++; continue; }
    if (Math.abs(Number(cell) - v) <= 1e-6 * Math.max(1, v)) matched++; else if (ex.length < 5) ex.push({ c, y, graph: v, undp: cell });
  }
  meta[le.id] = { series: "le", seriesDescription: "Life expectancy at birth (years)", sources: [{ name: "UNDP Human Development Report Office", n: Object.keys(snap.obs).length }], nature: [], units: "years", dataUrl: HDRO_CSV };
  results[le.id] = { source: "UNDP HDRO composite indices time series (CSV)", checked, matched, missingInApi: missing, mismatched: checked - matched - missing, matchRate: +(matched / checked).toFixed(4), examples: ex };
  console.log(`${le.id.padEnd(28)} ${matched}/${checked} match  missing ${missing}`);
}

// Registry links.
const links = {};
for (const ind of registry.indicators) {
  try { const r = await fetch(ind.metaUrl, { method: "HEAD", redirect: "follow" }); links[ind.id] = r.status; } catch { links[ind.id] = "error"; }
}
const totals = Object.values(results).reduce((a, r) => ({ checked: a.checked + r.checked, matched: a.matched + r.matched }), { checked: 0, matched: 0 });
writeFileSync("data/sdg-meta.json", JSON.stringify({ apiRelease: Object.values(seriesList)[0]?.release, generatedAt: new Date().toISOString(), indicators: meta }, null, 1));
writeFileSync("data/verification.json", JSON.stringify({ generatedAt: new Date().toISOString(), totals: { ...totals, matchRate: +(totals.matched / totals.checked).toFixed(4) }, results, metadataLinks: links }, null, 1));
console.log("TOTAL", totals, (totals.matched / totals.checked).toFixed(4), "\nlinks", links);
