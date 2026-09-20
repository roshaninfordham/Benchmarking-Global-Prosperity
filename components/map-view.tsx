"use client";
import { useMemo, useState } from "react";
import { fmt, t, type Lang } from "@/lib/i18n";
import { allLatest, quantile } from "@/lib/stats";
import type { State } from "@/lib/state";
import type { Dataset, Indicator } from "@/lib/types";
import { ChartHead } from "./chart-head";
import { Globe } from "./globe";

export function MapView({ ds, ind, lang, state, onPick }: { ds: Dataset; ind: Indicator; lang: Lang; state: State; onPick: (iso: string, additive: boolean) => void }) {
  const L = t(lang);
  const [flat, setFlat] = useState(false);
  const vals = useMemo(() => Object.values(allLatest(ds, ind)).map((o) => o[1]), [ds, ind]);
  const stops = [0, 0.25, 0.5, 0.75, 1].map((p) => quantile(vals, p));
  return (
    <div className="mapview">
      <ChartHead ind={ind} lang={lang} extra={
        <div className="seg" role="group" aria-label={`${L.globe} / ${L.flatMap}`}>
          <button aria-pressed={!flat} onClick={() => setFlat(false)}>{L.globe}</button>
          <button aria-pressed={flat} onClick={() => setFlat(true)}>{L.flatMap}</button>
        </div>} />
      <div className={flat ? "map-stage flat" : "map-stage"}>
        <Globe ds={ds} ind={ind} lang={lang} subject={state.country} comps={state.comps} flat={flat} onPick={onPick} />
      </div>
      <div className="map-legend">
        <div className="ramp" role="img" aria-label={`${L.legendRange}: ${fmt(stops[0], lang)} – ${fmt(stops[4], lang)}`} />
        <div className="ramp-labels num">{stops.map((s, i) => <span key={i}>{fmt(s, lang)}</span>)}</div>
        <div className="nodata"><i />{L.legendNoData}</div>
      </div>
      <p className="chart-foot">{L.dragGlobe}</p>
      <p className="map-note">{L.mapNote}</p>
    </div>
  );
}
