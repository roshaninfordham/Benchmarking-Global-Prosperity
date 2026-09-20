// Builds data/geo.json: countries seen in the snapshot plus their UN geographic
// groupings, via the REST `containedInPlace` arc (paced; single-node fallback).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { restNode, sleep } from "./mcp.mjs";

const names = {};
for (const f of readdirSync("data/snapshot")) {
  Object.assign(names, JSON.parse(readFileSync(`data/snapshot/${f}`, "utf8")).names);
}
const ids = Object.keys(names).sort();
const arcs = {};
const absorb = (data) => { for (const [k, v] of Object.entries(data)) arcs[k.replace("country/", "")] = v.arcs?.containedInPlace?.nodes ?? []; };

for (let i = 0; i < ids.length; i += 20) {
  const chunk = ids.slice(i, i + 20).map((c) => `country/${c}`);
  try { absorb(await restNode(chunk, "->containedInPlace", { retries: 1 })); }
  catch {
    for (const c of chunk) { try { absorb(await restNode([c], "->containedInPlace", { retries: 2 })); } catch { console.warn("no groups for", c); } await sleep(200); }
  }
  await sleep(500);
}

const groups = {};
for (const [c, nodes] of Object.entries(arcs)) {
  for (const n of nodes) {
    if (n.types[0] === "Country") continue;
    (groups[n.dcid] ??= { name: n.name, type: n.types[0], members: [] }).members.push(c);
  }
}
writeFileSync("data/geo.json", JSON.stringify({ names, groups }, null, 1));
console.log(ids.length, "countries;", Object.keys(groups).length, "groups");
