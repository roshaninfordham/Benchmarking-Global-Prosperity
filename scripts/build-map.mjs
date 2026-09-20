// Builds public/map/world.json for the globe from Natural Earth's 1:10m countries drawn from India's point of view
// (India's boundary as India depicts it, including Jammu and Kashmir, Ladakh and Arunachal Pradesh).
// The 10 m file is 13 MB, so it is simplified to a light TopoJSON that keeps every country, including small ones.
// Run: node scripts/build-map.mjs   (needs network; the output is committed)
import { mkdirSync, writeFileSync } from "node:fs";
import { geoArea, geoCentroid } from "d3-geo";
import { presimplify, quantile, simplify } from "topojson-simplify";
import { topology } from "topojson-server";
import { quantize } from "topojson-client";

const SRC = "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_10m_admin_0_countries_ind.geojson";
const MIN_AREA = 4e-6; // steradians
const KEEP = Number(process.argv[2] ?? 0.1); // share of points kept

const fc = await (await fetch(SRC)).json();
const rev = (ring) => ring.slice().reverse();
const islands = [];
const features = fc.features.map((f) => {
  const p = f.properties;
  const iso3 = p.ISO_A3_EH !== "-99" ? p.ISO_A3_EH : p.ADM0_A3;
  // d3 needs clockwise outer rings. Flip a polygon that d3 reads as "the rest of the globe".
  const fix = (poly) => (geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map(rev) : poly);
  const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).map(fix);
  const area = (poly) => geoArea({ type: "Polygon", coordinates: poly });
  // Pieces under about 160 km2 (Lakshadweep, the Maldives, most small islands) are too small to survive simplification,
  // so each becomes a point that the globe draws as a dot. A country's largest piece always stays a polygon.
  const largest = polys.reduce((a, b) => (area(b) > area(a) ? b : a));
  const big = polys.filter((poly) => poly === largest || area(poly) >= MIN_AREA);
  const small = polys.filter((poly) => !big.includes(poly));
  if (small.length) islands.push({ type: "Feature", properties: { iso3, name: p.NAME }, geometry: { type: "MultiPoint", coordinates: small.map((poly) => geoCentroid({ type: "Polygon", coordinates: poly })) } });
  return { type: "Feature", properties: { iso3, name: p.NAME }, geometry: { type: "MultiPolygon", coordinates: big } };
});

let topo = topology({ countries: { type: "FeatureCollection", features }, islands: { type: "FeatureCollection", features: islands } });
topo = presimplify(topo);
// Keep India's coastline and border at full source detail (every point of every arc its shapes use).
const india = topo.objects.countries.geometries.find((g) => g.properties.iso3 === "IND");
const arcsOf = (x) => (Array.isArray(x) ? x.flatMap(arcsOf) : [x < 0 ? ~x : x]);
for (const i of new Set(arcsOf(india.arcs))) for (const pt of topo.arcs[i]) pt[2] = Infinity;
topo = simplify(topo, quantile(topo, KEEP)); // quantile(p) keeps the heaviest p of the points
topo = quantize(topo, 2e4); // whole-number, delta-encoded coordinates (drops the simplification weights too)
const json = JSON.stringify(topo);
mkdirSync("public/map", { recursive: true });
writeFileSync("public/map/world.json", json);
console.log(features.length, "countries,", islands.reduce((n, f) => n + f.geometry.coordinates.length, 0), "island dots,", (json.length / 1024).toFixed(0), "KB");
