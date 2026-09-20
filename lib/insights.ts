import { valueText, nameOf } from "./format";
import { countryName, fmt, fmtPct, t, tpl, type Lang } from "./i18n";
import { REFERENCE_YEAR, STALE_AFTER, change, gap, groupSummary, latest, type Verdict } from "./stats";
import type { Comparator, Dataset, Indicator, Obs } from "./types";

export type Tone = "ahead" | "behind" | Verdict | "limit" | "note";
export interface Finding { id: string; tone: Tone; indicatorId?: string; view?: "compare" | "trend"; text: string; lang?: "en" }

/** Value of a comparator for one indicator: a country's latest observation or a group's median. */
export function comparatorValue(ds: Dataset, ind: Indicator, c: Comparator): { v: number; year: number; yearMax?: number } | undefined {
  if (c.kind === "country") { const o = latest(ds.data[ind.id].obs[c.id]); return o && { v: o[1], year: o[0] }; }
  const g = ds.groups.find((x) => x.id === c.id);
  const s = g && groupSummary(ds, ind, g);
  return s && { v: s.median, year: s.yearMin, yearMax: s.yearMax };
}

const MAX_YEAR_GAP = 5;

/** Builds the headline findings shown in the insight area. Every finding names the indicator it comes from. */
export function buildFindings(ds: Dataset, lang: Lang, subject: string | null, comps: Comparator[]): Finding[] {
  const L = t(lang), F = L.findings;
  if (!subject) return [];
  const c = countryName(subject, lang);
  const out: Finding[] = [];
  const rows = ds.indicators.map((ind) => ({ ind, s: ds.data[ind.id].obs[subject] }));

  // 1. Largest gaps against the first comparator, only where the observation years are comparable.
  const primary = comps[0];
  if (primary) {
    const cmp = nameOf(ds, primary, lang);
    const cands = rows.flatMap(({ ind, s }) => {
      const a = latest(s), b = comparatorValue(ds, ind, primary);
      if (!a || !b || Math.abs(a[0] - b.year) > MAX_YEAR_GAP || a[0] < REFERENCE_YEAR - 10) return [];
      const g = gap(a[1], b.v, ind);
      const size = g.ratio ? Math.abs(Math.log(g.ratio)) : g.pct !== null ? Math.abs(g.pct) / 100 : 0;
      return [{ ind, a, b, g, size }];
    }).sort((x, y) => y.size - x.size);
    const make = (k: (typeof cands)[number], tone: "ahead" | "behind"): Finding => {
      const times = k.g.ratio !== null && (k.g.ratio >= 1.5 || k.g.ratio <= 1 / 1.5);
      const x = k.g.ratio! >= 1 ? k.g.ratio! : 1 / k.g.ratio!;
      const rel = times && k.g.ratio! >= 1
        ? tpl(F.rel.times, { x: fmt(x, lang), cmp })
        : tpl(F.rel.diff, { d: `${fmt(Math.abs(k.g.abs), lang)}${k.ind.unit.startsWith("%") ? "" : ""}`, dir: k.g.abs > 0 ? L.above : L.below, cmp });
      return { id: `gap-${k.ind.id}`, tone, indicatorId: k.ind.id, view: "compare", text: tpl(F.gap, { ind: k.ind.short, a: valueText(k.ind, k.a[1], lang), c, rel, b: valueText(k.ind, k.b.v, lang) }), lang: "en" };
    };
    const behind = cands.find((k) => !k.g.favourable), ahead = cands.find((k) => k.g.favourable);
    if (behind) out.push(make(behind, "behind"));
    if (ahead) out.push(make(ahead, "ahead"));
  }

  // 2. Largest movement since the SDG baseline: the biggest improvement and the biggest setback.
  const moves = rows.flatMap(({ ind, s }) => { const ch = change(s, ind); return ch && ch.pct !== null && ch.verdict !== "flat" ? [{ ind, ch }] : []; });
  const bestMove = moves.filter((m) => m.ch.verdict === "better").sort((a, b) => Math.abs(b.ch.pct!) - Math.abs(a.ch.pct!))[0];
  const worstMove = moves.filter((m) => m.ch.verdict === "worse").sort((a, b) => Math.abs(b.ch.pct!) - Math.abs(a.ch.pct!))[0];
  for (const m of [bestMove, worstMove]) if (m) out.push({ id: `chg-${m.ind.id}`, tone: m.ch.verdict, indicatorId: m.ind.id, view: "trend", lang: "en", text: tpl(F.change, { ind: m.ind.short, verb: F.verbs[m.ch.verdict], a: valueText(m.ind, m.ch.from[1], lang), y0: m.ch.from[0], b: valueText(m.ind, m.ch.to[1], lang), y1: m.ch.to[0], pct: fmtPct(m.ch.pct!, lang) }) });

  // 3. Data limits: indicators with nothing recent.
  const stale = rows.filter(({ s }) => { const o: Obs | undefined = latest(s); return !o || REFERENCE_YEAR - o[0] > STALE_AFTER; });
  if (stale.length) out.push({ id: "limits", tone: "limit", text: tpl(F.noRecent, { n: stale.length, m: rows.length, y: REFERENCE_YEAR - STALE_AFTER, c }) });

  // 4. One method note for the leading finding, in the source's own words.
  const lead = out.find((f) => f.indicatorId);
  const leadInd = lead && ds.indicators.find((i) => i.id === lead.indicatorId);
  if (leadInd) out.push({ id: `note-${leadInd.id}`, tone: "note", indicatorId: leadInd.id, lang: "en", text: `${leadInd.short}: ${leadInd.notes}` });
  return out;
}
