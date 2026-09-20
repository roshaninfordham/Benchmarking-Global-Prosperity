import countries from "i18n-iso-countries";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import type { Topology } from "topojson-specification";

export type CountryFeature = Feature<Geometry, { name: string }> & { iso3?: string };

let pending: Promise<CountryFeature[]> | undefined;

/** World country shapes (Natural Earth 110m via world-atlas), tagged with ISO3. */
export function loadCountries(): Promise<CountryFeature[]> {
  return (pending ??= import("world-atlas/countries-110m.json").then((m) => {
    const topo = (m.default ?? m) as unknown as Topology;
    const byNum = new Map(Object.keys(countries.getAlpha3Codes()).map((a3) => [countries.alpha3ToNumeric(a3), a3]));
    const fc = feature(topo, topo.objects.countries as never) as unknown as { features: CountryFeature[] };
    for (const f of fc.features) f.iso3 = byNum.get(String(f.id).padStart(3, "0"));
    return fc.features;
  }));
}
