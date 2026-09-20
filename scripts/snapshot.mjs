// Pulls one country panel per registry indicator from the UN Data Commons MCP
// and writes data/snapshot/<id>.json. Paced and resumable: existing files are
// skipped unless --force is passed.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { callTool, sleep } from "./mcp.mjs";

const registry = JSON.parse(readFileSync("data/registry.json", "utf8"));
const force = process.argv.includes("--force");
mkdirSync("data/snapshot", { recursive: true });

const stats = [];
for (const ind of registry.indicators) {
  const file = `data/snapshot/${ind.id}.json`;
  if (existsSync(file) && !force) { console.log("skip", ind.id); continue; }

  const panel = await callTool("get_child_observations", {
    variable_dcid: ind.dcid, parent_place_dcid: "Earth", child_place_type: "Country",
    date: "range", date_range_start: "1990", date_range_end: "2026",
  });
  const rows = panel.data?.rows ?? [];
  if (!rows.length) { console.error("EMPTY", ind.id, ind.dcid); process.exitCode = 1; continue; }

  const obs = {};
  for (const [place, date, value] of rows) (obs[place.replace("country/", "")] ??= []).push([Number(date), value]);
  for (const k in obs) obs[k].sort((a, b) => a[0] - b[0]);

  // Provenance for the facets serving this variable (sample of countries).
  const meta = await callTool("get_variable_metadata", { variable_dcids: [ind.dcid], entity_dcids: ["country/KEN", "country/USA", "country/IND"] });
  const v = meta.variables?.[ind.dcid] ?? {};
  const provenances = Object.fromEntries(
    Object.entries(meta.provenances ?? {}).map(([id, p]) => [id, { source: p.properties?.source, isPartOf: p.properties?.isPartOf, url: p.properties?.url }]),
  );

  writeFileSync(file, JSON.stringify({
    id: ind.id, dcid: ind.dcid, fetchedAt: new Date().toISOString(),
    unitDcid: panel.sourceMetadata?.unit, observationPeriod: panel.sourceMetadata?.observationPeriod,
    provenanceUrl: panel.sourceMetadata?.provenanceUrl, facetId: panel.sourceMetadata?.sourceId,
    alternativeSources: panel.alternativeSources ?? [],
    graphName: panel.variable?.name, facets: v.facets ?? [], provenances,
    names: Object.fromEntries(panel.entityMetadata.rows.map(([d, n]) => [d.replace("country/", ""), n])),
    obs,
  }));
  const n = Object.values(obs).reduce((s, a) => s + a.length, 0);
  stats.push({ id: ind.id, countries: Object.keys(obs).length, observations: n });
  console.log(`ok   ${ind.id.padEnd(28)} ${String(Object.keys(obs).length).padStart(3)} countries ${String(n).padStart(5)} obs`);
  await sleep(400);
}
