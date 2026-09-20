export type Obs = [year: number, value: number];
export type Better = "lower" | "higher";

export interface Indicator {
  id: string;
  dimension: string;
  dcid: string;
  sdg: { goal: number; target: string; indicator: string } | null;
  name: string;
  short: string;
  unit: string;
  better: Better;
  baselineYear: number | null;
  targetYear: number | null;
  targetValue?: number;
  metaUrl: string;
}

/** Cited metadata from the UN SDG Global Database API (or the UNDP file for non-SDG series). */
export interface IndicatorMeta {
  series: string; seriesDescription?: string; release?: string;
  goal?: string; target?: string; indicator?: string; targetText?: string; indicatorTitle?: string; units?: string;
  sources: { name: string; n: number }[]; nature: { code: string; label: string; n: number }[];
  sourceNames?: string[];
  /** Per country: [nature code, source index, lower bound, upper bound, current year in the source database, current value] */
  latest?: Record<string, [string, number, string | null, string | null, number, number]>;
  dataUrl: string;
}
export interface Verification { censoredAtSource?: number; identicalOfComparable?: number; checked: number; identical: number; within1pct: number; absentInApi: number; identicalRate: number; medianRelativeDifference?: number; countriesWithNewerYearInApi?: number; source: string }

export interface Evidence {
  graphName: string;
  facetId: string;
  period: string;
  datasetUrl: string;
  provenance: string;
  otherSeries: number;
  retrievedAt: string;
}

export interface Group { id: string; name: string; short?: string; type: string; members: string[] }
export interface Dimension { id: string; name: string }

export interface Dataset {
  dimensions: Dimension[];
  indicators: Indicator[];
  data: Record<string, { obs: Record<string, Obs[]>; evidence: Evidence; meta?: IndicatorMeta; verification?: Verification; censored?: Record<string, Record<string, string>> }>;
  apiRelease?: string;
  countries: string[];
  groups: Group[];
}

/** A comparator is a country (ISO3), a UN grouping (dcid) or a custom group (ISO3 codes joined by "+"). */
export type Comparator = { kind: "country" | "group" | "custom"; id: string };
