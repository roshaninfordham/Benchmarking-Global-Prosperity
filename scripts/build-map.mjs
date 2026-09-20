// Builds public/map/world.json for the globe from Natural Earth's 1:10m countries drawn from India's point of view
// (India's boundary as India depicts it, including Jammu and Kashmir, Ladakh and Arunachal Pradesh).
// The 10 m file is 13 MB, so it is simplified to a light TopoJSON that keeps every country, including small ones.
// Run: node scripts/build-map.mjs   (needs network; the output is committed)
import { mkdirSync, writeFileSync } from "node:fs";
import { geoArea } from "d3-geo";
import { presimplify, quantile, simplify } from "topojson-simplify";
import { topology } from "topojson-server";
import { quantize } from "topojson-client";

const SRC = "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_10m_admin_0_countries_ind.geojson";
const MIN_AREA = 4e-6; // steradians
const KEEP = Number(process.argv[2] ?? 0.1); // share of points kept

const fc = await (await fetch(SRC)).json();
const rev = (ring) => ring.slice().reverse();
const features = fc.features.map((f) => {
  const p = f.properties;
  let g = f.geometry;
  // d3 needs clockwise outer rings. Flip a polygon that d3 reads as "the rest of the globe".
  const fix = (poly) => (geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map(rev) : poly);
  const polys = (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map(fix);
  // Drop specks (under about 160 km2) but always keep a country's largest piece, so small states stay on the map.
  const area = (poly) => geoArea({ type: "Polygon", coordinates: poly });
  const big = polys.filter((poly) => area(poly) >= MIN_AREA);
  const kept = big.length ? big : [polys.reduce((a, b) => (area(b) > area(a) ? b : a))];
  g = { type: "MultiPolygon", coordinates: kept };
  return { type: "Feature", properties: { iso3: p.ISO_A3_EH !== "-99" ? p.ISO_A3_EH : p.ADM0_A3, name: p.NAME }, geometry: g };
});

let topo = topology({ countries: { type: "FeatureCollection", features } });
topo = presimplify(topo);
topo = simplify(topo, quantile(topo, KEEP)); // quantile(p) keeps the heaviest p of the points
topo = quantize(topo, 2e4); // whole-number, delta-encoded coordinates (drops the simplification weights too)
const json = JSON.stringify(topo);
mkdirSync("public/map", { recursive: true });
writeFileSync("public/map/world.json", json);
console.log(features.length, "countries,", (json.length / 1024).toFixed(0), "KB");
