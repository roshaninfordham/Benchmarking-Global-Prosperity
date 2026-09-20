// Finds observations the official database publishes as a threshold ("<2.5") rather than a number.
// The Data Commons graph stores the bare number, so without this the app would present a floor as a measurement.
// Only series that had values without a numeric counterpart in verify.mjs are examined.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { sleep } from "./mcp.mjs";

const iso = createRequire(import.meta.url)("i18n-iso-countries");
const API = "https://unstats.un.org/sdgapi/v1/sdg";
const registry = JSON.parse(readFileSync("data/registry.json", "utf8"));
const ver = JSON.parse(readFileSync("data/verification.json", "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const getJson = async (url) => { for (let i = 0; ; i++) { try { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return await r.json(); } catch (e) { if (i > 3) throw e; await sleep(1500 * 2 ** i); } } };

const out = {};
for (const ind of registry.indicators) {
  if (!ind.dcid.startsWith("undata/sdg/") || !(ver.results[ind.id]?.absentInApi > 0)) continue;
  const [code, ...dimParts] = ind.dcid.split("/")[2].split(".");
  const want = {};
  for (const part of dimParts.join(".").split("__").filter(Boolean)) { const [k, v] = part.split("--"); want[norm(k)] = v; }
  const snap = JSON.parse(readFileSync(`data/snapshot/${ind.id}.json`, "utf8"));
  const isos = Object.keys(snap.obs).filter((c) => iso.alpha3ToNumeric(c));
  const rows = []; const dimCodes = {};
  for (let i = 0; i < isos.length; i += 40) {
    const q = isos.slice(i, i + 40).map((c) => `areaCode=${Number(iso.alpha3ToNumeric(c))}`).join("&");
    const page = await getJson(`${API}/Series/Data?seriesCode=${code}&${q}&pageSize=100000`);
    rows.push(...page.data);
    for (const d of page.dimensions ?? []) dimCodes[d.id] = { ...(dimCodes[d.id] ?? {}), ...Object.fromEntries(d.codes.map((c) => [c.code, c.sdmx])) };
    await sleep(300);
  }
  const sdmx = (d, c) => dimCodes[d]?.[c] ?? c;
  const num2iso = Object.fromEntries(isos.map((c) => [String(Number(iso.alpha3ToNumeric(c))), c]));
  const res = {}; let n = 0;
  for (const r of rows) {
    if (!/^[<>]/.test(String(r.value))) continue;
    const ok = Object.entries(r.dimensions).every(([d, c]) => d === "Reporting Type" || (want[norm(d)] !== undefined ? sdmx(d, c) === want[norm(d)] : sdmx(d, c) === "_T"));
    const c = num2iso[String(Number(r.geoAreaCode))], y = Math.trunc(r.timePeriodStart);
    if (!ok || !c || !snap.obs[c]?.some(([yy]) => yy === y)) continue;
    (res[c] ??= {})[y] = String(r.value); n++;
  }
  out[ind.id] = res;
  ver.results[ind.id].censoredAtSource = n;
  const comparable = ver.results[ind.id].checked - ver.results[ind.id].absentInApi;
  ver.results[ind.id].identicalOfComparable = +(ver.results[ind.id].identical / comparable).toFixed(4);
  console.log(ind.id, "censored observations:", n, "countries:", Object.keys(res).length, "absent:", ver.results[ind.id].absentInApi);
}
writeFileSync("data/censored.json", JSON.stringify(out));
writeFileSync("data/verification.json", JSON.stringify(ver, null, 1));
