// Compiles registry + snapshots + geo into one static file the client loads once,
// and writes coverage metrics used by the README.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const iso = require("i18n-iso-countries");

const registry = JSON.parse(readFileSync("data/registry.json", "utf8"));
const geo = JSON.parse(readFileSync("data/geo.json", "utf8"));
const sdgMeta = existsSync("data/sdg-meta.json") ? JSON.parse(readFileSync("data/sdg-meta.json", "utf8")) : { indicators: {} };
const verification = existsSync("data/verification.json") ? JSON.parse(readFileSync("data/verification.json", "utf8")) : { results: {} };
const valid = new Set(Object.keys(iso.getAlpha3Codes()));
const round = (v) => Number(Number(v).toPrecision(5));

const indicators = {};
let totalObs = 0;
const perIndicator = [];
for (const ind of registry.indicators) {
  const snap = JSON.parse(readFileSync(`data/snapshot/${ind.id}.json`, "utf8"));
  const obs = {};
  for (const [c, rows] of Object.entries(snap.obs)) {
    if (!valid.has(c)) continue;
    obs[c] = rows.map(([y, v]) => [y, round(v)]);
    totalObs += rows.length;
  }
  const latest = Object.values(obs).map((r) => r.at(-1)[0]);
  perIndicator.push({ id: ind.id, countries: Object.keys(obs).length, observations: Object.values(obs).reduce((s, r) => s + r.length, 0), medianLatestYear: latest.sort()[Math.floor(latest.length / 2)] });
  const prov = Object.values(snap.provenances)[0] ?? {};
  indicators[ind.id] = {
    obs,
    meta: sdgMeta.indicators[ind.id], verification: verification.results[ind.id],
    evidence: {
      graphName: snap.graphName, facetId: snap.facetId, period: snap.observationPeriod,
      datasetUrl: snap.provenanceUrl ?? prov.url, provenance: prov.isPartOf ?? prov.source,
      otherSeries: snap.alternativeSources.length, retrievedAt: snap.fetchedAt,
    },
  };
}

const countries = Object.keys(geo.names).filter((c) => valid.has(c)).sort();
const groups = Object.entries(geo.groups)
  .filter(([, g]) => g.members.length >= 3 && !g.name.includes(": ") && g.type !== "Continent")
  .map(([id, g]) => ({ id, name: g.name.replace(/ \(([A-Z]+)\)$/, ""), short: g.name.match(/\(([A-Z]+)\)$/)?.[1], type: g.type, members: g.members.filter((c) => valid.has(c)) }))
  .sort((a, b) => b.members.length - a.members.length);
const continents = Object.entries(geo.groups).filter(([, g]) => g.type === "Continent").map(([id, g]) => ({ id, name: g.name, type: g.type, members: g.members.filter((c) => valid.has(c)) }));

mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/bgp.json", JSON.stringify({
  generatedAt: new Date().toISOString(), apiRelease: sdgMeta.apiRelease, dimensions: registry.dimensions, indicators: registry.indicators,
  data: indicators, countries, groups: [...groups, ...continents],
}));
mkdirSync("docs", { recursive: true });
writeFileSync("docs/metrics.json", JSON.stringify({ indicators: registry.indicators.length, countries: countries.length, observations: totalObs, perIndicator }, null, 1));
console.log({ indicators: registry.indicators.length, countries: countries.length, groups: groups.length + continents.length, totalObs });
