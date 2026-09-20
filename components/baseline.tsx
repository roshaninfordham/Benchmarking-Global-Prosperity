"use client";
import { useMemo } from "react";
import { fmt, countryName, t, type Lang } from "@/lib/i18n";
import { valueText } from "@/lib/format";
import { buildSeries } from "@/lib/series";
import { gap, worldSummary } from "@/lib/stats";
import type { State } from "@/lib/state";
import type { Dataset, Indicator } from "@/lib/types";
import { ToneTag } from "./tone";

const D = 1.5; // half-width of the scale, in units of the spread of the middle half of countries

function Row({ ds, ind, lang, state, onOpen }: { ds: Dataset; ind: Indicator; lang: Lang; state: State; onOpen: (id: string) => void }) {
  const L = t(lang);
  const w = worldSummary(ds, ind);
  const series = useMemo(() => buildSeries(ds, ind, state.country, state.comps, lang), [ds, ind, state.country, state.comps, lang]);
  const subject = series.find((s) => s.isSubject);
  const orient = ind.better === "higher" ? 1 : -1;
  const spread = w ? w.q3 - w.q1 || 1 : 1;
  const z = (v: number) => (orient * (v - w!.median)) / spread;
  const pos = (v: number) => ((Math.max(-D, Math.min(D, z(v))) + D) / (2 * D)) * 100;
  const sl = subject?.latest;
  const g = w && sl && !subject?.censored ? gap(sl.v, w.median, ind) : null;
  const band = w ? [pos(w.q1), pos(w.q3)].sort((a, b) => a - b) : [0, 0];
  return (
    <button className="bl-row" onClick={() => onOpen(ind.id)} style={{ background: "none", width: "100%", textAlign: "start", font: "inherit", color: "inherit", cursor: "pointer", borderInline: 0, borderBottom: 0 }}>
      <div className="bl-name"><b lang="en">{ind.short}</b><span lang="en">{ind.unit}</span></div>
      <div className="bl-track">
        {w ? (
          <>
            <div className="bl-line" />
            <div className="bl-band" style={{ insetInlineStart: `${band[0]}%`, width: `${band[1] - band[0]}%` }} />
            <div className="bl-mid" style={{ insetInlineStart: "50%" }} />
            {sl && <div className="bl-bar" style={{ insetInlineStart: `${Math.min(50, pos(sl.v))}%`, width: `${Math.abs(pos(sl.v) - 50)}%`, background: "var(--s1)" }} />}
            {[...series].reverse().map((s) => s.latest && (
              <i key={s.key} className={`bl-dot ${s.isSubject ? "subject" : ""} ${s.kind === "group" ? "group" : ""}`} title={`${s.label}: ${valueText(ind, s.latest.v, lang)} · ${s.latest.year}${Math.abs(z(s.latest.v)) > D ? ` · ${L.beyond}` : ""}`}
                style={{ insetInlineStart: `${pos(s.latest.v)}%`, background: s.color }} />
            ))}
          </>
        ) : <div className="bl-none">{L.noData}</div>}
      </div>
      <div className="bl-val num">
        {sl ? <><b title={subject?.censored ? L.censoredHint : undefined}>{subject?.censored ?? valueText(ind, sl.v, lang)} <span className="yr">{sl.year}</span></b>
          {g && w && <><ToneTag tone={g.favourable ? "ahead" : "behind"} label={`${g.abs > 0 ? "+" : "−"}${fmt(Math.abs(g.abs), lang, 1)} ${L.vs} ${fmt(w.median, lang, 1)}`} />
            <span>{L.medianCountry}: {countryName(w.medianCountry.c, lang)}, {w.medianCountry.o[0]}</span></>}</>
          : <span>{state.country ? L.noData : L.pickCountry}</span>}
      </div>
    </button>
  );
}

export function Baseline({ ds, lang, state, onOpen }: { ds: Dataset; lang: Lang; state: State; onOpen: (id: string) => void }) {
  const L = t(lang);
  const dims = ds.dimensions.filter((d) => state.dim === "all" || d.id === state.dim);
  return (
    <div className="baseline">
      <p className="strip-note">{L.baselineNote}</p>
      <div className="bl-row bl-head" style={{ border: 0, minHeight: 0 }} aria-hidden>
        <div />
        <div className="bl-legend"><span>← {L.lessFav}</span><span>{L.medianCountry}</span><span>{L.moreFav} →</span></div>
        <div />
      </div>
      {dims.map((d) => (
        <section key={d.id}>
          <h3 className="bl-dim">{(L.dims as Record<string, string>)[d.id] ?? d.name}</h3>
          {ds.indicators.filter((i) => i.dimension === d.id).map((i) => <Row key={i.id} ds={ds} ind={i} lang={lang} state={state} onOpen={onOpen} />)}
        </section>
      ))}
    </div>
  );
}
