"use client";
import { scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";
import { fmt, countryName, t, type Lang } from "@/lib/i18n";
import { buildSeries } from "@/lib/series";
import { allLatest, gap, quantile, worldExtent } from "@/lib/stats";
import type { State } from "@/lib/state";
import { useWidth } from "@/lib/use-size";
import type { Dataset, Indicator } from "@/lib/types";
import { SERIES, valueText } from "@/lib/format";
import { ChartHead } from "./chart-head";
import { ToneTag } from "./tone";

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

function Distribution({ ds, ind, lang, series }: { ds: Dataset; ind: Indicator; lang: Lang; series: ReturnType<typeof buildSeries> }) {
  const L = t(lang);
  const [ref, w] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<{ x: number; y: number; iso: string } | null>(null);
  const all = useMemo(() => allLatest(ds, ind), [ds, ind]);
  const vals = Object.values(all).map((o) => o[1]);
  const [lo, hi] = worldExtent(ds, ind);
  const shown = series.flatMap((s) => (s.latest ? [s.latest.v] : []));
  const dom: [number, number] = [Math.min(lo, ...shown), Math.max(hi, ...shown)];
  const H = 132, padX = 14, band = { y0: 62, y1: 112 };
  const x0 = scaleLinear().domain(dom).range([padX, w - padX]).nice();
  const x = Object.assign((v: number) => Math.max(padX, Math.min(w - padX, x0(v))), { invert: x0.invert }); // values beyond the 2nd to 98th percentile sit on the edge
  const pts = useMemo(() => Object.entries(all).map(([iso, o]) => ({ iso, o, cx: 0, cy: band.y0 + hash(iso) * (band.y1 - band.y0) })), [all, band.y0, band.y1]);
  const q1 = quantile(vals, 0.25), q3 = quantile(vals, 0.75);
  // Stagger labels so neighbouring marks do not collide.
  const marks = series.filter((s) => s.latest).map((s) => ({ s, px: x(s.latest!.v) })).sort((a, b) => a.px - b.px);
  const rows: number[] = [];
  const placed = marks.map((m) => { let r = 0; while (rows[r] !== undefined && m.px - rows[r] < 96) r++; rows[r] = m.px; return m; });
  const near = (e: React.PointerEvent) => {
    const b = e.currentTarget.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top;
    let best: (typeof pts)[number] | undefined, bd = 12;
    for (const p of pts) { const d = Math.hypot(x(p.o[1]) - mx, p.cy - my); if (d < bd) { bd = d; best = p; } }
    setTip(best ? { x: mx, y: my, iso: best.iso } : null);
  };
  const tipObs = tip ? all[tip.iso] : undefined;
  return (
    <div className="dist" ref={ref}>
      <div className="dist-head"><span>{L.worldSpread}</span><span className="num">{L.n} = {pts.length}</span></div>
      <svg width={w} height={H} onPointerMove={near} onPointerLeave={() => setTip(null)} role="img" aria-label={`${L.worldSpread}, ${pts.length}`}>
        <rect x={x(q1)} y={band.y0 - 8} width={Math.max(2, x(q3) - x(q1))} height={band.y1 - band.y0 + 16} rx="8" fill="var(--accent-soft)" />
        <text x={x(q1)} y={band.y1 + 26} fontSize="12" fill="var(--ink-3)">{L.spread}</text>
        {pts.map((p) => <circle key={p.iso} cx={x(p.o[1])} cy={p.cy} r="3.2" fill="var(--ink-3)" opacity={tip?.iso === p.iso ? 1 : 0.38} />)}
        {placed.map(({ s, px }) => (
          <g key={s.key} style={{ transition: "transform .6s cubic-bezier(.2,.8,.2,1)", transform: `translateX(${px}px)` }}>
            <line y1={26} y2={band.y1 + 10} stroke={s.color} strokeWidth="2" style={{ filter: "drop-shadow(0 0 4px var(--glow))" }} />
            <circle cy={band.y0 - 16} r="5" fill={s.color} stroke="var(--surface)" strokeWidth="2" />
            <text y={14} textAnchor={px < 70 ? "start" : px > w - 70 ? "end" : "middle"} fontSize="12" fontWeight="600" fill="var(--ink)">{s.label.length > 18 ? s.label.slice(0, 17) + "…" : s.label}</text>
          </g>
        ))}
      </svg>
      {tip && tipObs && <div className="tip" style={{ left: tip.x, top: tip.y }}><b>{countryName(tip.iso, lang)}</b><span className="num">{valueText(ind, tipObs[1], lang)} · {tipObs[0]}</span></div>}
    </div>
  );
}

export function Compare({ ds, ind, lang, state }: { ds: Dataset; ind: Indicator; lang: Lang; state: State }) {
  const L = t(lang);
  const [table, setTable] = useState(false);
  const series = useMemo(() => buildSeries(ds, ind, state.country, state.comps, lang), [ds, ind, state.country, state.comps, lang]);
  const subject = series.find((s) => s.isSubject);
  const shownMax = Math.max(0, ...series.flatMap((s) => (s.latest ? [s.latest.v, s.group?.q3 ?? 0] : [])));
  const x = scaleLinear().domain([0, shownMax || 1]).nice(4);
  const pct = (v: number) => `${(x(v) / x(x.domain()[1])) * 100}%`;
  const ticks = x.ticks(4);
  // Long bars carry their value inside the end, so the label never runs off the plot.
  const inside = (s: (typeof series)[number]) => !!s.latest && x(Math.max(s.latest.v, s.group?.q3 ?? 0)) / x(x.domain()[1]) > 0.82;

  return (
    <div className="compare">
      <ChartHead ind={ind} lang={lang} table={table} onTable={setTable} />
      {series.length === 0 || !subject?.latest ? (
        <div className="empty">{subject ? `${L.noDataFor} ${subject.label}` : L.pickCountry}</div>
      ) : table ? (
        <table className="dtable"><thead><tr><th>{L.country}</th><th>{L.latest}</th><th>{L.year}</th><th>{L.gapCol}</th></tr></thead>
          <tbody>{series.map((s) => { const g = s.latest && subject.latest && !s.isSubject ? gap(subject.latest.v, s.latest.v, ind) : null;
            return <tr key={s.key}><th scope="row">{s.label}</th><td className="num">{s.latest ? fmt(s.latest.v, lang, 2) : L.noData}</td><td className="num">{s.latest ? (s.latest.yearMax && s.latest.yearMax !== s.latest.year ? `${s.latest.year}–${s.latest.yearMax}` : s.latest.year) : "—"}</td><td className="num">{g ? `${g.abs > 0 ? "+" : "−"}${fmt(Math.abs(g.abs), lang, 2)}` : "—"}</td></tr>; })}</tbody></table>
      ) : (
        <div className="bars">
          <div className="bars-cap"><span>{L.gapFor.replace("{c}", subject.label)}</span></div>
          <div className="bars-grid" aria-hidden>
            {ticks.map((tk) => <span key={tk} style={{ insetInlineStart: pct(tk) }}><em className="num">{fmt(tk, lang, 0)}</em></span>)}
            {ind.targetValue !== undefined && <span className="bars-target" style={{ insetInlineStart: pct(ind.targetValue) }}><em>{L.target} {ind.targetValue}</em></span>}
          </div>
          {series.map((s, i) => {
            const g = s.latest && subject.latest && !s.isSubject ? gap(subject.latest.v, s.latest.v, ind) : null;
            const yrDiff = s.latest && subject.latest && Math.abs(s.latest.year - subject.latest.year) > 2;
            return (
              <div className="crow" key={s.key} style={{ ["--i" as string]: i }}>
                <div className="clabel"><i className="ckey" style={{ background: s.color }} /><span>{s.label}</span>{s.group && <small>{s.group.n}/{s.group.total}</small>}</div>
                <div className="cplot">
                  {s.latest ? (
                    <>
                      <div className="cbar" style={{ width: pct(s.latest.v), background: s.color, ["--glowc" as string]: s.color }} />
                      {s.group && <div className="cwhisk" style={{ insetInlineStart: pct(s.group.q1), width: `calc(${pct(s.group.q3)} - ${pct(s.group.q1)})`, borderColor: s.color }} title={L.spread} />}
                      <span className={inside(s) ? "cval num in" : "cval num"} style={inside(s)
                        ? { insetInlineStart: `calc(${pct(s.latest.v)} - 10px)`, color: s.color === SERIES[3] ? "#0c1a2b" : "#fff" }
                        : { insetInlineStart: `calc(${pct(Math.max(s.latest.v, s.group?.q3 ?? 0))} + 10px)` }}>
                        <b>{fmt(s.latest.v, lang, 2)}</b><em className={yrDiff ? "yr diff" : "yr"}>{s.latest.yearMax && s.latest.yearMax !== s.latest.year ? `${s.latest.year}–${s.latest.yearMax}` : s.latest.year}</em>
                      </span>
                    </>
                  ) : <span className="cnone">{L.noData}</span>}
                </div>
                <div className="cgap num">
                  {g && <><ToneTag tone={g.favourable ? "ahead" : "behind"} label={`${g.abs > 0 ? "+" : "−"}${fmt(Math.abs(g.abs), lang, 1)}${g.ratio && g.ratio >= 1.5 && Math.min(subject.latest!.v, s.latest!.v) >= 1 ? ` · ${fmt(g.ratio, lang)}×` : ""}`} />{yrDiff && <span className="yr-warn" role="img" aria-label={L.stale} title={L.findings.years.replace("{c}", subject.label).replace("{y1}", String(subject.latest!.year)).replace("{cmp}", s.label).replace("{y2}", String(s.latest!.year))}><ToneTag tone="limit" label="" /></span>}</>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {subject?.latest && !table && <Distribution ds={ds} ind={ind} lang={lang} series={series} />}
    </div>
  );
}
