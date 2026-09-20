export type Obs = [year: number, value: number];
export type Better = "lower" | "higher";

export interface Indicator {
  id: string;
  dimension: string;
  dcid: string;
  sdg: { goal: number; target: string; indicator: string } | null;
  name: string;
  short: string;
  definition: string;
  unit: string;
  better: Better;
  custodian: string;
  frequency: string;
  baselineYear: number | null;
  targetYear: number | null;
  targetValue?: number;
  targetNote: string | null;
  disaggregation: string;
  metaUrl: string;
  notes: string;
}

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
  generatedAt: string;
  dimensions: Dimension[];
  indicators: Indicator[];
  data: Record<string, { obs: Record<string, Obs[]>; evidence: Evidence }>;
  countries: string[];
  groups: Group[];
}

/** A comparator is a country (ISO3) or a UN grouping (dcid). */
export type Comparator = { kind: "country" | "group"; id: string };
