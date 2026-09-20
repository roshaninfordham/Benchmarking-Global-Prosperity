import type { Dataset, Group, Indicator, Obs } from "./types";

/** Year used to judge how old an observation is. */
export const REFERENCE_YEAR = 2026;
/** Observations older than this are flagged as stale. */
export const STALE_AFTER = 5;
/** Group aggregates only use member observations from this year on. */
export const GROUP_WINDOW = 2015;

export const latest = (s?: Obs[]): Obs | undefined => s?.at(-1);
export const age = (o: Obs) => REFERENCE_YEAR - o[0];
export const isStale = (o?: Obs) => !!o && age(o) > STALE_AFTER;

export function nearest(s: Obs[] | undefined, year: number, tol: number): Obs | undefined {
  let best: Obs | undefined;
  for (const o of s ?? []) if (Math.abs(o[0] - year) <= tol && (!best || Math.abs(o[0] - year) < Math.abs(best[0] - year))) best = o;
  return best;
}

export type Verdict = "better" | "worse" | "flat";
export interface Change { from: Obs; to: Obs; abs: number; pct: number | null; verdict: Verdict }

/** Change from the SDG baseline year (or the earliest observation five or more years back) to the latest. */
export function change(s: Obs[] | undefined, ind: Indicator): Change | undefined {
  const to = latest(s);
  if (!s || !to) return;
  const from = (ind.baselineYear && nearest(s, ind.baselineYear, 2)) || s.findLast((o) => to[0] - o[0] >= 5);
  if (!from || to[0] - from[0] < 3) return;
  const abs = to[1] - from[1];
  const pct = from[1] !== 0 ? (abs / Math.abs(from[1])) * 100 : null;
  const flat = pct !== null ? Math.abs(pct) < 3 : Math.abs(abs) < 0.05;
  const improving = ind.better === "lower" ? abs < 0 : abs > 0;
  return { from, to, abs, pct, verdict: flat ? "flat" : improving ? "better" : "worse" };
}

export const median = (xs: number[]) => quantile(xs, 0.5);
export function quantile(xs: number[], q: number): number {
  const a = [...xs].sort((x, y) => x - y);
  if (!a.length) return NaN;
  const p = (a.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
  return a[lo] + (a[hi] - a[lo]) * (p - lo);
}

export interface GroupSummary { median: number; q1: number; q3: number; n: number; total: number; yearMin: number; yearMax: number; points: { c: string; o: Obs }[] }

/** Median of each member's latest observation since GROUP_WINDOW. Members without one are counted as missing. */
export function groupSummary(ds: Dataset, ind: Indicator, g: Pick<Group, "members">): GroupSummary | undefined {
  const obs = ds.data[ind.id].obs;
  const points = g.members.flatMap((c) => { const o = latest(obs[c]); return o && o[0] >= GROUP_WINDOW ? [{ c, o }] : []; });
  if (points.length < 3) return;
  const vs = points.map((p) => p.o[1]), ys = points.map((p) => p.o[0]);
  return { median: median(vs), q1: quantile(vs, 0.25), q3: quantile(vs, 0.75), n: points.length, total: g.members.length, yearMin: Math.min(...ys), yearMax: Math.max(...ys), points };
}

/** Yearly median across members that reported that year (at least 3 members). */
export function groupSeries(ds: Dataset, ind: Indicator, g: Pick<Group, "members">): (Obs & { n?: number })[] {
  const obs = ds.data[ind.id].obs, byYear = new Map<number, number[]>();
  for (const c of g.members) for (const [y, v] of obs[c] ?? []) (byYear.get(y) ?? byYear.set(y, []).get(y)!).push(v);
  return [...byYear].filter(([, v]) => v.length >= 3).sort((a, b) => a[0] - b[0]).map(([y, v]) => Object.assign([y, median(v)] as Obs, { n: v.length }));
}

/** Latest observation for every country in the dataset, for distributions and the map. */
export function allLatest(ds: Dataset, ind: Indicator): Record<string, Obs> {
  const out: Record<string, Obs> = {};
  for (const [c, s] of Object.entries(ds.data[ind.id].obs)) { const o = latest(s); if (o) out[c] = o; }
  return out;
}

/** Signed gap of a versus b, and whether a is on the favourable side. */
export function gap(a: number, b: number, ind: Indicator) {
  const abs = a - b;
  return { abs, pct: b !== 0 ? (abs / Math.abs(b)) * 100 : null, ratio: b !== 0 && a > 0 && b > 0 ? a / b : null, favourable: ind.better === "lower" ? abs < 0 : abs > 0 };
}

const extents = new WeakMap<Indicator, [number, number]>();
/** 2nd to 98th percentile of every country's latest value, so a few outliers do not squash a scale. */
export function worldExtent(ds: Dataset, ind: Indicator): [number, number] {
  let e = extents.get(ind);
  if (!e) { const v = Object.values(allLatest(ds, ind)).map((o) => o[1]); e = [quantile(v, 0.02), quantile(v, 0.98)]; extents.set(ind, e); }
  return e;
}
