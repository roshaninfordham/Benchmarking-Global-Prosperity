"use client";
import { t, type Lang } from "@/lib/i18n";
import { VIEWS, type State, type View } from "@/lib/state";
import type { Dataset } from "@/lib/types";
import { Baseline } from "./baseline";
import { Compare } from "./compare";
import { IndicatorNav } from "./indicator-nav";
import { MapView } from "./map-view";
import { Overview } from "./overview";
import { Trend } from "./trend";

export function VizPanel({ ds, lang, state, patch, onPickCountry }: { ds: Dataset; lang: Lang; state: State; patch: (p: Partial<State>) => void; onPickCountry: (iso: string, additive: boolean) => void }) {
  const L = t(lang);
  const ind = ds.indicators.find((i) => i.id === state.indicator)!;
  const label: Record<View, string> = { overview: L.overview, baseline: L.viewBaseline, compare: L.compare, trend: L.trend, map: L.map };
  const i = VIEWS.indexOf(state.view);
  return (
    <section aria-labelledby="h-viz">
      <div className="area-head">
        <h2 id="h-viz" className="area-title">{L.visualization}</h2>
        <div className="viz-controls">
          <div className="chips" role="group" aria-label={L.allDims}>
            {["all", ...ds.dimensions.map((d) => d.id)].map((d) => (
              <button key={d} className="fchip" aria-pressed={state.dim === d} onClick={() => patch({ dim: d })}>{d === "all" ? L.allDims : (L.dims as Record<string, string>)[d]}</button>
            ))}
          </div>
          <div className="tabs" role="tablist" data-i={i} style={{ ["--n" as string]: VIEWS.length }}>
            <span className="tabs-ind" aria-hidden />
            {VIEWS.map((v) => <button key={v} role="tab" aria-selected={state.view === v} onClick={() => patch({ view: v })}>{label[v]}</button>)}
          </div>
        </div>
      </div>
      <div className="card viz-card" data-view={state.view}>
        {state.view === "overview" ? (
          <Overview ds={ds} lang={lang} state={state} onOpen={(id) => patch({ indicator: id, view: "compare" })} />
        ) : state.view === "baseline" ? (
          <Baseline ds={ds} lang={lang} state={state} onOpen={(id) => patch({ indicator: id, view: "compare" })} />
        ) : (
          <div className="viz-split">
            <IndicatorNav ds={ds} lang={lang} state={state} onSelect={(id) => patch({ indicator: id })} />
            <div className="viz-main" key={`${state.view}-${state.indicator}`}>
              {state.view === "compare" && <Compare ds={ds} ind={ind} lang={lang} state={state} />}
              {state.view === "trend" && <Trend ds={ds} ind={ind} lang={lang} state={state} />}
              {state.view === "map" && <MapView ds={ds} ind={ind} lang={lang} state={state} onPick={onPickCountry} />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
