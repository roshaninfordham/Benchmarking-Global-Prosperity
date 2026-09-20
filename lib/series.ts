import { membersOf, nameOf, SERIES } from "./format";
import type { Lang } from "./i18n";
import { groupSeries, groupSummary, latest, type GroupSummary } from "./stats";
import type { Comparator, Dataset, Indicator, Obs } from "./types";

export interface Series {
  key: string; label: string; color: string; kind: "country" | "group"; isSubject: boolean;
  obs: Obs[]; latest?: { v: number; year: number; yearMax?: number }; group?: GroupSummary; members?: string[];
}

/** The subject first, then each comparator, each with its own colour slot. */
export function buildSeries(ds: Dataset, ind: Indicator, subject: string | null, comps: Comparator[], lang: Lang): Series[] {
  const all: { c: Comparator; subject: boolean }[] = [...(subject ? [{ c: { kind: "country" as const, id: subject }, subject: true }] : []), ...comps.map((c) => ({ c, subject: false }))];
  return all.map(({ c, subject: isSubject }, i) => {
    const base = { key: `${c.kind}:${c.id}`, label: nameOf(ds, c, lang), color: SERIES[i], kind: c.kind === "country" ? ("country" as const) : ("group" as const), isSubject };
    if (c.kind === "country") { const obs = ds.data[ind.id].obs[c.id] ?? []; const l = latest(obs); return { ...base, obs, latest: l && { v: l[1], year: l[0] } }; }
    const g = { members: membersOf(ds, c) };
    const sum = groupSummary(ds, ind, g);
    return { ...base, obs: groupSeries(ds, ind, g), group: sum, members: g.members, latest: sum && { v: sum.median, year: sum.yearMin, yearMax: sum.yearMax } };
  });
}
