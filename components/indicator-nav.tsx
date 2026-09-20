"use client";
import { censoredText } from "@/lib/censor";
import { fmt, t, type Lang } from "@/lib/i18n";
import { isStale, latest } from "@/lib/stats";
import type { State } from "@/lib/state";
import type { Dataset } from "@/lib/types";

export function IndicatorNav({ ds, lang, state, onSelect }: { ds: Dataset; lang: Lang; state: State; onSelect: (id: string) => void }) {
  const L = t(lang);
  const dims = ds.dimensions.filter((d) => state.dim === "all" || d.id === state.dim);
  return (
    <nav className="inav" aria-label={L.pickIndicator}>
      {dims.map((d) => (
        <div key={d.id} className="inav-group">
          <div className="inav-dim">{(L.dims as Record<string, string>)[d.id] ?? d.name}</div>
          {ds.indicators.filter((i) => i.dimension === d.id).map((i) => {
            const o = state.country ? latest(ds.data[i.id].obs[state.country]) : undefined;
            return (
              <button key={i.id} className="inav-item" aria-current={i.id === state.indicator} onClick={() => onSelect(i.id)}>
                <span className="inav-name" lang="en">{i.short}</span>
                <span className={`inav-val num ${!o ? "none" : isStale(o) ? "stale" : ""}`}>{o ? (state.country && censoredText(ds, i.id, state.country, o[0])) || fmt(o[1], lang) : "—"}{o && <em>{o[0]}</em>}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
