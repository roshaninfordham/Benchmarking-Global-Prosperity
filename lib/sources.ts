import countries from "i18n-iso-countries";
import type { IndicatorMeta } from "./types";

export const SDG_PORTAL = "https://unstats.un.org/sdgs/dataportal/database";
const m49 = (iso3: string) => { const n = countries.alpha3ToNumeric(iso3); return n ? String(Number(n)) : undefined; };

/** Link to the official value for one country: the SDG Global Database API for SDG series, UNDP's country page otherwise. */
export function officialLink(meta: IndicatorMeta | undefined, dcid: string, iso3: string): { kind: "sdg" | "undp"; url: string } | undefined {
  if (dcid.startsWith("undata/sdg/") && meta?.series) {
    const a = m49(iso3);
    return a ? { kind: "sdg", url: `https://unstats.un.org/sdgapi/v1/sdg/Series/Data?seriesCode=${meta.series}&areaCode=${a}&pageSize=200` } : undefined;
  }
  if (dcid.startsWith("undata/undphdro/")) return { kind: "undp", url: `https://hdr.undp.org/data-center/specific-country-data#/countries/${iso3}` };
}
