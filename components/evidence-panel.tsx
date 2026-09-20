"use client";
import { useMemo, useState } from "react";
import { fmt, t, type Lang } from "@/lib/i18n";
import { buildSeries } from "@/lib/series";
import type { State } from "@/lib/state";
import { isStale } from "@/lib/stats";
import type { Dataset } from "@/lib/types";
import { ToneTag } from "./tone";

const HOSTS: Record<string, string> = { "unstats.un.org": "UN SDG Global Database (UNSD)", "hdr.undp.org": "UNDP Human Development Report Office", "ilostat.ilo.org": "ILOSTAT (ILO)" };
const host = (u?: string) => { try { return new URL(u ?? "").hostname; } catch { return ""; } };

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="ext" href={href} target="_blank" rel="noreferrer noopener">{children}<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7.5 8.5" /></svg></a>;
}

export function EvidencePanel({ ds, lang, state }: { ds: Dataset; lang: Lang; state: State }) {
  const L = t(lang);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const ind = ds.indicators.find((i) => i.id === state.indicator)!;
  const ev = ds.data[ind.id].evidence;
  const series = useMemo(() => buildSeries(ds, ind, state.country, state.comps, lang), [ds, ind, state.country, state.comps, lang]);
  const subject = series.find((s) => s.isSubject);
  const basis = /EST_BASIS--(MODEL|SURVEY)/.exec(ind.dcid)?.[1];
  const code = `get_observations(variable_dcid="${ind.dcid}", place_dcid="country/${state.country ?? "KEN"}", date="range", date_range_start="2000")`;
  const copy = (what: "link" | "code", text: string) => { navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(null), 1600); }); };

  const flags = [
    subject && !subject.latest && { tone: "limit" as const, text: `${L.noDataFor} ${subject.label}` },
    subject?.obs.length && isStale(subject.obs.at(-1)) && { tone: "limit" as const, text: `${subject.label}: ${L.stale}, ${subject.obs.at(-1)![0]}` },
    ...series.filter((s) => s.group).map((s) => ({ tone: "note" as const, text: `${s.label}: ${L.members} ${s.group!.n}/${s.group!.total} · ${L.groupNote}` })),
    ...series.filter((s) => s.kind === "group" && !s.group).map((s) => ({ tone: "limit" as const, text: `${s.label}: ${L.noData}` })),
    { tone: "note" as const, text: ind.notes },
  ].filter(Boolean) as { tone: "limit" | "note"; text: string }[];

  const inView = useMemo(() => {
    const m = new Map<string, { name: string; url: string; n: number }>();
    for (const i of ds.indicators) { const u = ds.data[i.id].evidence.datasetUrl, h = host(u); const e = m.get(h) ?? { name: HOSTS[h] ?? h, url: u, n: 0 }; e.n++; m.set(h, e); }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [ds]);

  return (
    <section aria-labelledby="h-ev">
      <div className="area-head">
        <h2 id="h-ev" className="area-title">{L.evidence}</h2>
        <button className="pick" onClick={() => copy("link", location.href)}>{copied === "link" ? L.linkCopied : L.copyLink}</button>
      </div>
      <div className="card ev" key={ind.id}>
        <div className="ev-grid">
          <div className="ev-main">
            <div className="ev-title"><h3 lang="en">{ind.name}</h3>{ind.sdg && <span className="sdg-chip num">{L.sdg} {ind.sdg.indicator}</span>}</div>
            <p className="ev-def" lang="en">{ind.definition}</p>
            <dl className="ev-dl">
              <div><dt>{L.unit}</dt><dd lang="en">{ind.unit}</dd></div>
              <div><dt>{L.custodian}</dt><dd lang="en">{ind.custodian}</dd></div>
              <div><dt>{L.source}</dt><dd lang="en">{ev.provenance}</dd></div>
              <div><dt>{L.dataset}</dt><dd lang="en">{ev.graphName}</dd></div>
              <div><dt>{L.frequency}</dt><dd lang="en">{ind.frequency}</dd></div>
              <div><dt>{L.basis}</dt><dd>{basis ? (basis === "MODEL" ? "Model-based estimate" : "Survey-based estimate") : L.basisUnknown}</dd></div>
              <div><dt>{L.updated}</dt><dd>{L.notPublished}</dd></div>
              <div><dt>{L.retrieved}</dt><dd className="num">{ev.retrievedAt.slice(0, 10)}</dd></div>
              <div><dt>{L.disagg}</dt><dd lang="en">{ind.disaggregation}</dd></div>
              <div><dt>{L.otherSeries}</dt><dd className="num">{ev.otherSeries}</dd></div>
            </dl>
            <div className="ev-links">
              <Link href={ev.datasetUrl}>{L.dataLink}</Link>
              <Link href={ind.metaUrl}>{L.methodLink}</Link>
            </div>
          </div>
          <div className="ev-side">
            <h4>{L.visualization}</h4>
            <table className="dtable ev-table">
              <thead><tr><th>{L.country}</th><th>{L.latest}</th><th>{L.year}</th></tr></thead>
              <tbody>
                {series.map((s) => (
                  <tr key={s.key}><td><i className="ckey" style={{ background: s.color }} /> {s.label}</td>
                    <td className="num">{s.latest ? fmt(s.latest.v, lang, 2) : L.noData}</td>
                    <td className="num">{s.latest ? (s.latest.yearMax && s.latest.yearMax !== s.latest.year ? `${s.latest.year}–${s.latest.yearMax}` : s.latest.year) : "—"}</td></tr>
                ))}
              </tbody>
            </table>
            <ul className="ev-flags">{flags.map((f, i) => <li key={i}><ToneTag tone={f.tone} label="" /><span lang={f.tone === "note" && f.text === ind.notes ? "en" : undefined}>{f.text}</span></li>)}</ul>
            <div className="ev-code">
              <div className="ev-code-head"><span>{L.reproduce}</span><button onClick={() => copy("code", code)}>{copied === "code" ? L.copied : L.copy}</button></div>
              <pre><code>{code}</code></pre>
              <div className="ev-dcid"><span>{L.dcid}</span><code>{ind.dcid}</code></div>
            </div>
          </div>
        </div>
        <div className="ev-sources">
          {inView.map((s) => <Link key={s.name} href={s.url}>{s.name} <b className="num">{s.n}</b></Link>)}
        </div>
      </div>
    </section>
  );
}
