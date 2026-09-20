import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import type { Topology } from "topojson-specification";

export type CountryFeature = Feature<Geometry, { iso3: string; name: string }> & { iso3?: string };
export interface WorldShapes { countries: CountryFeature[]; /** Pieces too small to draw as areas (Lakshadweep, the Maldives...), as points. */ islands: CountryFeature[] }

let pending: Promise<WorldShapes> | undefined;

/** World shapes from public/map/world.json (built by scripts/build-map.mjs), tagged with ISO3. */
export function loadCountries(): Promise<WorldShapes> {
  return (pending ??= fetch("/map/world.json")
    .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Topology>; })
    .then((topo) => {
      const read = (name: string) => (feature(topo, topo.objects[name] as never) as unknown as { features: CountryFeature[] }).features.map((f) => Object.assign(f, { iso3: f.properties.iso3 }));
      return { countries: read("countries"), islands: read("islands") };
    })
    .catch((e) => { pending = undefined; throw e; }));
}
