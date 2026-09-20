"use client";
import { useMemo } from "react";
import { countryName, t, type Lang } from "@/lib/i18n";
import { nameOf, SERIES } from "@/lib/format";
import type { Finding } from "@/lib/insights";
import { REFERENCE_YEAR, STALE_AFTER, latest } from "@/lib/stats";
import { MAX_COMPARATORS } from "@/lib/state";
import type { Comparator, Dataset, Indicator } from "@/lib/types";
import { Combobox, type Option } from "./combobox";
import { Globe } from "./globe";
import { ToneTag } from "./tone";

const TONE_LABEL = (L: ReturnType<typeof t>, f: Finding) =>
  ({ ahead: L.ahead, behind: L.behind, better: L.better, worse: L.worse, flat: L.flat, limit: L.limits, note: L.note })[f.tone];

export function InsightPanel({ ds, lang, ind, country, comps, findings, options, onAdd, onRemove, onTrace, onPickCountry }: {
  ds: Dataset; lang: Lang; ind: Indicator; country: string | null; comps: Comparator[]; findings: Finding[]; options: Option[];
  onAdd: (c: Comparator) => void; onRemove: (i: number) => void; onTrace: (f: Finding) => void; onPickCountry: (iso3: string, additive: boolean) => void;
}) {
  const L = t(lang);
  const cov = useMemo(() => {
    if (!country) return null;
    let withData = 0, stale = 0;
    for (const i of ds.indicators) { const o = latest(ds.data[i.id].obs[country]); if (o) { withData++; if (REFERENCE_YEAR - o[0] > STALE_AFTER) stale++; } }
    return { withData, stale, missing: ds.indicators.length - withData, total: ds.indicators.length };
  }, [ds, country]);
  const addable = options.filter((o) => !(o.kind === "country" && (o.id === country || comps.some((c) => c.kind === "country" && c.id === o.id))) && !(o.kind === "group" && comps.some((c) => c.kind === "group" && c.id === o.id)));

  return (
    <section className="card insight" aria-labelledby="h-insight">
      <div className="insight-top">
        <div className="insight-main">
          <h2 id="h-insight" className="sr-only">{L.insight}</h2>
          <div className="who display" data-key={country}>{country ? countryName(country, lang) : L.pickCountry}</div>
          {cov && (
            <div className="coverage num" aria-label={L.coverage}>
              <span><b>{cov.withData}</b> / {cov.total} {L.indicatorsWithData}</span>
              {cov.stale > 0 && <span className="cov-warn"><b>{cov.stale}</b> {L.staleN}</span>}
              {cov.missing > 0 && <span className="cov-warn"><b>{cov.missing}</b> {L.missingN}</span>}
            </div>
          )}
          <div className="vs-row">
            <span className="vs-label">{L.compareWith}</span>
            {comps.map((c, i) => (
              <span className="chip" key={c.kind + c.id}>
                <span className="key" style={{ background: SERIES[i + 1] }} />{nameOf(ds, c, lang)}
                <button onClick={() => onRemove(i)} aria-label={`${L.remove}: ${nameOf(ds, c, lang)}`}><svg viewBox="0 0 16 16" width="12" height="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m4 4 8 8M12 4l-8 8" /></svg></button>
              </span>
            ))}
            {comps.length < MAX_COMPARATORS
              ? <Combobox options={addable} placeholder={L.search} empty={L.noData} triggerClass="pick pick-ghost" onPick={(o) => onAdd({ kind: o.kind, id: o.id })}
                  trigger={<><svg viewBox="0 0 16 16" width="14" height="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M8 3v10M3 8h10" /></svg>{L.add}</>} />
              : <span className="vs-max">{L.maxComp}</span>}
          </div>
        </div>
        <div className="insight-globe"><Globe ds={ds} ind={ind} lang={lang} subject={country} comps={comps} onPick={onPickCountry} /></div>
      </div>
      <ul className="findings">
        {findings.map((f, i) => (
          <li key={f.id} style={{ animationDelay: `${i * 70}ms` }}>
            <button className="finding" data-tone={f.tone} disabled={!f.indicatorId} onClick={() => onTrace(f)} title={f.indicatorId ? L.jump : undefined}>
              <ToneTag tone={f.tone} dir={f.dir} label={TONE_LABEL(L, f)} />
              <span className="finding-text" lang={f.lang}>{f.text}</span>
            </button>
          </li>
        ))}
        {!findings.length && <li className="finding-empty">{L.findings.none}</li>}
      </ul>
    </section>
  );
}
