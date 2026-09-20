"use client";
import { line } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { useId, useMemo, useState } from "react";
import { fmt, t, type Lang } from "@/lib/i18n";
import { buildSeries, type Series } from "@/lib/series";
import type { State } from "@/lib/state";
import { useWidth } from "@/lib/use-size";
import type { Dataset, Indicator, Obs } from "@/lib/types";
import { ChartHead } from "./chart-head";

const M = { t: 18, r: 150, b: 34, l: 44 };
const H = 400;
const GAP_YEARS = 3;

function segments(obs: Obs[], gen: (d: Obs[]) => string | null) {
  const out: { d: string; dashed: boolean }[] = [];
  for (let i = 1; i < obs.length; i++) out.push({ d: gen([obs[i - 1], obs[i]])!, dashed: obs[i][0] - obs[i - 1][0] > GAP_YEARS });
  return out;
}

export function Trend({ ds, ind, lang, state }: { ds: Dataset; ind: Indicator; lang: Lang; state: State }) {
  const L = t(lang);
  const uid = useId().replace(/:/g, "");
  const [ref, w] = useWidth<HTMLDivElement>();
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const series = useMemo(() => buildSeries(ds, ind, state.country, state.comps, lang), [ds, ind, state.country, state.comps, lang]);
  const withObs = series.filter((s) => s.obs.length);
  const narrow = w < 560, mr = narrow ? 16 : M.r;

  const { x, y, years } = useMemo(() => {
    const ys = withObs.flatMap((s) => s.obs.map((o) => o[0]));
    const vs = withObs.flatMap((s) => s.obs.map((o) => o[1]));
    if (ind.targetValue !== undefined) vs.push(ind.targetValue);
    const x0 = Math.max(1990, Math.min(...ys, 2015)), x1 = Math.max(...ys, ind.targetValue !== undefined && ind.targetYear ? ind.targetYear : 0);
    const mn = Math.min(...vs), mx = Math.max(...vs);
    const lo = mn / mx < 0.5 ? 0 : mn - (mx - mn) * 0.12;
    return { x: scaleLinear().domain([x0, x1]).range([M.l, w - mr]), y: scaleLinear().domain([lo, mx]).nice().range([H - M.b, M.t]), years: [...new Set(ys)].sort((a, b) => a - b) };
  }, [withObs, ind, w, mr]);

  if (!withObs.length) return <div className="trend"><ChartHead ind={ind} lang={lang} /><div className="empty">{state.country ? L.noData : L.pickCountry}</div></div>;

  const gen = line<Obs>().x((d) => x(d[0])).y((d) => y(d[1]));
  const yt = y.ticks(5), xt = x.ticks(Math.max(3, Math.floor((w - M.l - mr) / 90))).filter(Number.isInteger);

  // Direct labels at the line ends, nudged apart.
  const ends = withObs.map((s) => ({ s, y: y(s.obs.at(-1)![1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 17) ends[i].y = ends[i - 1].y + 17;

  const at = (s: Series, yr: number) => s.obs.find((o) => o[0] === yr);
  const before = (s: Series, yr: number) => [...s.obs].reverse().find((o) => o[0] <= yr);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const b = e.currentTarget.getBoundingClientRect(), yr = x.invert(e.clientX - b.left);
    if (e.clientX - b.left < M.l - 8 || e.clientX - b.left > w - mr + 8) return setHover(null);
    setHover(years.reduce((a, c) => (Math.abs(c - yr) < Math.abs(a - yr) ? c : a), years[0]));
  };
  const tipX = hover !== null ? x(hover) : 0;

  return (
    <div className="trend" ref={ref}>
      <ChartHead ind={ind} lang={lang} table={table} onTable={setTable} />
      {series.length > 1 && (
        <ul className="legend">{series.map((s) => <li key={s.key} style={{ opacity: s.obs.length ? 1 : 0.45 }}><i className="lkey" style={{ background: s.color }} />{s.label}{!s.obs.length && <em> · {L.noData}</em>}</li>)}</ul>
      )}
      {table ? (
        <div className="tscroll"><table className="dtable"><thead><tr><th>{L.year}</th>{series.map((s) => <th key={s.key}>{s.label}</th>)}</tr></thead>
          <tbody>{[...years].reverse().map((yr) => <tr key={yr}><td className="num">{yr}</td>{series.map((s) => <td key={s.key} className="num">{at(s, yr) ? fmt(at(s, yr)![1], lang, 2) : "—"}</td>)}</tr>)}</tbody></table></div>
      ) : (
        <div className="tplot">
          <svg width={w} height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`${ind.short}: ${series.map((s) => s.label).join(", ")}`}>
            <defs><clipPath id={`rv${uid}`}><rect className="reveal" x="0" y="0" width={w} height={H} /></clipPath></defs>
            {yt.map((v) => <g key={v}><line x1={M.l} x2={w - mr} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={M.l - 10} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--ink-3)" className="num">{fmt(v, lang, 0)}</text></g>)}
            {xt.map((v) => <text key={v} x={x(v)} y={H - 10} textAnchor="middle" fontSize="12" fill="var(--ink-3)" className="num">{v}</text>)}
            {ind.baselineYear && x(ind.baselineYear) > M.l && x(ind.baselineYear) < w - mr && <g><line x1={x(ind.baselineYear)} x2={x(ind.baselineYear)} y1={M.t} y2={H - M.b} stroke="var(--line-strong)" /><text x={x(ind.baselineYear) + 6} y={M.t + 10} fontSize="12" fill="var(--ink-3)">{L.baseline}</text></g>}
            {ind.targetValue !== undefined && <g><line x1={M.l} x2={w - mr} y1={y(ind.targetValue)} y2={y(ind.targetValue)} stroke="var(--ink-2)" strokeDasharray="6 5" /><text x={M.l + 6} y={y(ind.targetValue) - 7} fontSize="12" fontWeight="600" fill="var(--ink-2)">{L.target} {fmt(ind.targetValue, lang, 0)} · {ind.targetYear}</text></g>}
            <g clipPath={`url(#rv${uid})`}>
              {[...withObs].reverse().map((s) => (
                <g key={s.key} style={{ filter: s.isSubject ? "drop-shadow(0 0 6px var(--glow))" : undefined }}>
                  {segments(s.obs, gen).map((g, i) => <path key={i} d={g.d} fill="none" stroke={s.color} strokeWidth={s.isSubject ? 2.6 : 2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={g.dashed ? "2 6" : undefined} />)}
                  {s.obs.length <= 30 && s.obs.map((o) => <circle key={o[0]} cx={x(o[0])} cy={y(o[1])} r={s.kind === "group" ? 2.6 : 3.4} fill={s.color} stroke="var(--surface)" strokeWidth="1.5" />)}
                </g>
              ))}
            </g>
            {hover !== null && <g><line x1={tipX} x2={tipX} y1={M.t} y2={H - M.b} stroke="var(--ink-3)" />
              {withObs.map((s) => { const o = at(s, hover); return o && <circle key={s.key} cx={x(hover)} cy={y(o[1])} r="6" fill={s.color} stroke="var(--surface)" strokeWidth="2.5" />; })}</g>}
            {!narrow && ends.map(({ s, y: ly }) => (
              <g key={s.key}><text x={w - mr + 12} y={ly + 4} fontSize="13" fill="var(--ink)"><tspan fontWeight="600" className="num">{fmt(s.obs.at(-1)![1], lang)}</tspan><tspan dx="6" fill="var(--ink-2)">{s.label.length > 13 ? s.label.slice(0, 12) + "…" : s.label}</tspan></text></g>
            ))}
          </svg>
          {hover !== null && (
            <div className="tip tip-multi" style={{ left: Math.min(tipX + 14, w - 230), top: 20 }} role="status">
              <b className="num">{hover}</b>
              {series.map((s) => { const o = at(s, hover), b = o ?? before(s, hover);
                return <div key={s.key} className="tip-row"><i className="lkey" style={{ background: s.color }} /><span className="tip-name">{s.label}</span><span className="num tip-val">{o ? fmt(o[1], lang, 2) : "—"}{!o && b && <em> ({b[0]})</em>}</span></div>; })}
            </div>
          )}
        </div>
      )}
      <p className="chart-foot"><i className="dash" aria-hidden />{L.gapInSeries}</p>
    </div>
  );
}
