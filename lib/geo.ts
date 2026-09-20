import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import type { Topology } from "topojson-specification";

export type CountryFeature = Feature<Geometry, { iso3: string; name: string }> & { iso3?: string };

let pending: Promise<CountryFeature[]> | undefined;

/** World country shapes from public/map/world.json (built by scripts/build-map.mjs), tagged with ISO3. */
export function loadCountries(): Promise<CountryFeature[]> {
  return (pending ??= fetch("/map/world.json")
    .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Topology>; })
    .then((topo) => {
      const fc = feature(topo, topo.objects.countries as never) as unknown as { features: CountryFeature[] };
      for (const f of fc.features) f.iso3 = f.properties.iso3;
      return fc.features;
    })
    .catch((e) => { pending = undefined; throw e; }));
}
