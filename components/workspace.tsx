"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countryName, dirOf, t, type Lang } from "@/lib/i18n";
import { buildFindings, type Finding } from "@/lib/insights";
import { DEFAULT_STATE, MAX_COMPARATORS, fromQuery, toQuery, type State, type View } from "@/lib/state";
import { latest } from "@/lib/stats";
import { useDataset } from "@/lib/use-dataset";
import type { Comparator } from "@/lib/types";
import type { Option } from "./combobox";
import { EvidencePanel } from "./evidence-panel";
import { InsightPanel } from "./insight-panel";
import { Topbar } from "./topbar";
import { VizPanel } from "./viz-panel";

export function Workspace() {
  const { ds, failed, retry } = useDataset();
  const [s, setS] = useState<State>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [traceKey, setTraceKey] = useState(0);
  const vizRef = useRef<HTMLDivElement>(null);
  const evRef = useRef<HTMLDivElement>(null);
  const L = t(s.lang);

  // Read the shared link once the data is here (it decides which ids are valid).
  useEffect(() => {
    if (!ds) return;
    const q = location.search;
    const st = fromQuery(q, { indicators: ds.indicators.map((i) => i.id), countries: ds.countries, groups: ds.groups.map((g) => g.id), dims: ds.dimensions.map((d) => d.id) });
    const stored = document.documentElement.lang as Lang;
    setS(new URLSearchParams(q).has("lang") || !q ? { ...st, lang: new URLSearchParams(q).has("lang") ? st.lang : stored in { en: 1, fr: 1, es: 1, ru: 1, zh: 1, ar: 1 } ? stored : "en" } : st);
    setReady(true);
  }, [ds]);

  useEffect(() => {
    if (!ready) return;
    history.replaceState(null, "", `?${toQuery(s)}`);
    document.documentElement.lang = s.lang; document.documentElement.dir = dirOf(s.lang);
    try { localStorage.setItem("bgp-lang", s.lang); } catch {}
  }, [s, ready]);

  const withData = useMemo(() => {
    if (!ds) return [] as string[];
    return ds.countries.filter((c) => ds.indicators.some((i) => latest(ds.data[i.id].obs[c])));
  }, [ds]);
  const options = useMemo<Option[]>(() => {
    if (!ds) return [];
    const col = new Intl.Collator(s.lang);
    const cs = withData.map((c) => ({ id: c, label: countryName(c, s.lang), hint: c, section: L.countriesLabel, kind: "country" as const })).sort((a, b) => col.compare(a.label, b.label));
    const gs = ds.groups.map((g) => ({ id: g.id, label: g.name, hint: String(g.members.length), section: L.groupsLabel, kind: "group" as const }));
    return [...gs, ...cs];
  }, [ds, withData, s.lang, L]);

  const ind = ds?.indicators.find((i) => i.id === s.indicator);
  const findings = useMemo(() => (ds ? buildFindings(ds, s.lang, s.country, s.comps) : []), [ds, s.lang, s.country, s.comps]);

  const patch = useCallback((p: Partial<State>) => setS((x) => ({ ...x, ...p })), []);
  const pickCountry = useCallback((iso: string, additive = false) => setS((x) => {
    if (additive && x.country && iso !== x.country) {
      if (x.comps.some((c) => c.kind === "country" && c.id === iso) || x.comps.length >= MAX_COMPARATORS) return x;
      return { ...x, comps: [...x.comps, { kind: "country", id: iso }] };
    }
    return { ...x, country: iso, comps: x.comps.filter((c) => !(c.kind === "country" && c.id === iso)) };
  }), []);
  const trace = useCallback((f: Finding) => {
    if (!f.indicatorId) return;
    patch({ indicator: f.indicatorId, view: (f.view ?? "compare") as View });
    setTraceKey((k) => k + 1);
    requestAnimationFrame(() => vizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [patch]);

  if (failed) return <main className="boot"><p>{L.loadFail}</p><button className="pick" onClick={retry}>{L.retry}</button></main>;
  if (!ds || !ind || !ready) return <main className="boot" aria-busy><div className="boot-globe" /></main>;

  return (
    <>
      <a className="skip" href="#main">{L.skip}</a>
      <Topbar lang={s.lang} country={s.country} options={options.filter((o) => o.kind === "country")} onCountry={(c) => pickCountry(c)} onLang={(lang) => patch({ lang })} />
      <main id="main" className="page">
        <div className="stack" data-trace={traceKey} key={traceKey ? "t" : "n"} style={{ gridColumn: 2 }}>
          <div className="area area-insight">
            <InsightPanel ds={ds} lang={s.lang} ind={ind} country={s.country} comps={s.comps} findings={findings} options={options}
              onAdd={(c: Comparator) => patch({ comps: [...s.comps, c].slice(0, MAX_COMPARATORS) })} onRemove={(i) => patch({ comps: s.comps.filter((_, j) => j !== i) })}
              onTrace={trace} onPickCountry={pickCountry} />
          </div>
          <div className="area area-viz" ref={vizRef}>
            <VizPanel ds={ds} lang={s.lang} state={s} patch={patch} onPickCountry={pickCountry} />
          </div>
          <div className="area area-evidence" ref={evRef}>
            <EvidencePanel ds={ds} lang={s.lang} state={s} />
          </div>
        </div>
      </main>
    </>
  );
}
