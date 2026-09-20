"use client";
import { useMemo } from "react";
import { fmt, fmtPct, t, type Lang } from "@/lib/i18n";
import { buildSeries, type Series } from "@/lib/series";
import { change, isStale, worldExtent } from "@/lib/stats";
import type { State } from "@/lib/state";
import { useCountUp } from "@/lib/use-count-up";
import type { Dataset, Indicator } from "@/lib/types";
import { Sparkline } from "./sparkline";
import { ToneTag } from "./tone";

function Strip({ ds, ind, series }: { ds: Dataset; ind: Indicator; series: Series[] }) {
  const [lo, hi] = worldExtent(ds, ind);
  const pos = (v: number) => { const p = Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1))); return (ind.better === "lower" ? 1 - p : p) * 100; };
  return (
    <div className="strip" aria-hidden>
      <div className="strip-track" />
      {[...series].reverse().map((s) => s.latest && <i key={s.key} className={s.isSubject ? "strip-dot subject" : s.kind === "group" ? "strip-dot group" : "strip-dot"} style={{ insetInlineStart: `${pos(s.latest.v)}%`, background: s.color }} />)}
    </div>
  );
}

function Card({ ds, ind, lang, state, onOpen }: { ds: Dataset; ind: Indicator; lang: Lang; state: State; onOpen: (id: string) => void }) {
  const L = t(lang);
  const series = useMemo(() => buildSeries(ds, ind, state.country, state.comps, lang), [ds, ind, state.country, state.comps, lang]);
  const subject = series.find((s) => s.isSubject);
  const l = subject?.latest;
  const ch = subject?.censored ? undefined : change(subject?.obs, ind);
  const shown = useCountUp(l?.v, `${state.country}-${ind.id}`);
  const stale = subject?.obs.length ? isStale(subject.obs.at(-1)) : false;
  return (
    <button className="icard" data-empty={!l} onClick={() => onOpen(ind.id)}>
      <div className="icard-head">
        <span className="icard-name">{ind.short}</span>
        {ind.sdg && <span className="icard-sdg">{L.sdg} {ind.sdg.indicator}</span>}
      </div>
      {l ? (
        <>
          <div className="icard-val"><span className="display num" title={subject?.censored ? L.censoredHint : undefined}>{subject?.censored ?? fmt(shown ?? l.v, lang)}</span><span className="icard-unit">{ind.unit}</span></div>
          <div className="icard-meta">
            <span className={`year num ${stale ? "stale" : ""}`} title={stale ? L.stale : undefined}>{l.year}{stale && <em>{L.staleShort}</em>}</span>
            {ch && <span className="icard-change num"><ToneTag tone={ch.verdict} dir={ch.abs >= 0 ? "up" : "down"} label={ch.pct !== null ? fmtPct(ch.pct, lang) : fmt(ch.abs, lang)} /><span className="since">{L.since} {ch.from[0]}</span></span>}
          </div>
          <div className="icard-spark"><Sparkline obs={subject!.obs} w={240} h={40} color="var(--s1)" /></div>
        </>
      ) : <div className="icard-none"><span>{L.noData}</span></div>}
      <Strip ds={ds} ind={ind} series={series} />
    </button>
  );
}

export function Overview({ ds, lang, state, onOpen }: { ds: Dataset; lang: Lang; state: State; onOpen: (id: string) => void }) {
  const L = t(lang);
  const dims = ds.dimensions.filter((d) => state.dim === "all" || d.id === state.dim);
  return (
    <div className="overview">
      <p className="strip-note">{L.stripNote}</p>
      {dims.map((d) => (
        <section key={d.id} className="dim">
          <h3 className="dim-title">{(L.dims as Record<string, string>)[d.id] ?? d.name}</h3>
          <div className="icards">
            {ds.indicators.filter((i) => i.dimension === d.id).map((i) => <Card key={i.id} ds={ds} ind={i} lang={lang} state={state} onOpen={onOpen} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
