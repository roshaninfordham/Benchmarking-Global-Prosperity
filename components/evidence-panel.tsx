"use client";
import { useMemo, useState } from "react";
import { censoredText } from "@/lib/censor";
import { countryName, fmt, t, type Lang } from "@/lib/i18n";
import { buildSeries, type Series } from "@/lib/series";
import { SDG_PORTAL, cleanSource, officialLink } from "@/lib/sources";
import type { State } from "@/lib/state";
import { isStale, latest } from "@/lib/stats";
import type { Dataset, Indicator, IndicatorMeta } from "@/lib/types";
import { ToneTag } from "./tone";

const HOSTS: Record<string, string> = { "unstats.un.org": "UN SDG Global Database (UNSD)", "hdr.undp.org": "UNDP Human Development Report Office" };
const host = (u?: string) => { try { return new URL(u ?? "").hostname; } catch { return ""; } };

function Ext({ href, children, small }: { href: string; children: React.ReactNode; small?: boolean }) {
  return <a className={small ? "ext ext-s" : "ext"} href={href} target="_blank" rel="noreferrer noopener">{children}<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7.5 8.5" /></svg></a>;
}

/** One verifiable row: our value, the official database's current value, how it was produced and where to check it. */
function VerifyRow({ ds, ind, meta, iso, name, lang, obs }: { ds: Dataset; ind: Indicator; meta?: IndicatorMeta; iso: string; name: React.ReactNode; lang: Lang; obs?: [number, number] }) {
  const L = t(lang);
  const o = obs ?? latest(ds.data[ind.id].obs[iso]);
  const info = meta?.latest?.[iso];
  const link = officialLink(meta, ind.dcid, iso);
  const cText = o ? censoredText(ds, ind.id, iso, o[0]) : undefined;
  const offCens = Object.entries(ds.data[ind.id].censored?.[iso] ?? {}).sort((a, b) => Number(a[0]) - Number(b[0])).at(-1);
  const label = info && meta?.nature.find((n) => n.code === info[0])?.label;
  const newer = o && info && (info[4] > o[0] || Math.abs(info[5] - o[1]) > 0.01 * Math.max(1e-9, Math.abs(o[1])));
  return (
    <tr>
      <th scope="row">{name}</th>
      <td className="num">{o ? <><span title={cText ? L.censoredHint : undefined}>{cText ?? fmt(o[1], lang, 2)}</span> <span className="yr">{o[0]}</span></> : "—"}</td>
      <td className="num">{info ? <span className={newer ? "diff-cell" : undefined}>{fmt(info[5], lang, 2)} <span className="yr">{info[4]}</span></span> : offCens ? <span title={L.censoredHint}>{offCens[1]} <span className="yr">{offCens[0]}</span></span> : meta?.latest ? L.notInSource : "—"}</td>
      <td className="ev-nature">{label ? <><span lang="en">{label}</span>{meta?.sourceNames?.[info![1]] && <small lang="en">{cleanSource(meta.sourceNames[info![1]])}</small>}{info![2] != null && info![3] != null && <small className="num">{L.uncertainty}: {fmt(Number(info![2]), lang, 1)}–{fmt(Number(info![3]), lang, 1)}</small>}</> : "—"}</td>
      <td>{link ? <Ext small href={link.url}>{link.kind === "sdg" ? L.sdgApi : L.undpPage}</Ext> : null}</td>
    </tr>
  );
}

function SeriesRows({ ds, ind, meta, s, lang }: { ds: Dataset; ind: Indicator; meta?: IndicatorMeta; s: Series; lang: Lang }) {
  const L = t(lang);
  const [open, setOpen] = useState(false);
  const key = <><i className="ckey" style={{ background: s.color }} /> {s.label}</>;
  if (s.kind === "country") return <VerifyRow ds={ds} ind={ind} meta={meta} iso={s.key.slice(8)} name={key} lang={lang} />;
  const rows = s.group?.points ?? [];
  return (
    <>
      <tr>
        <th scope="row">{key}</th>
        <td className="num">{s.latest ? <>{fmt(s.latest.v, lang, 2)} <span className="yr">{L.groupMedian}, {rows.length}/{s.members?.length ?? 0}</span></> : "—"}</td>
        <td colSpan={2}><button className="linkbtn" onClick={() => setOpen(!open)} aria-expanded={open}>{L.showMembers} ({rows.length})</button></td>
        <td />
      </tr>
      {open && [...rows].sort((a, b) => countryName(a.c, lang).localeCompare(countryName(b.c, lang), lang)).map((p) => (
        <VerifyRow key={p.c} ds={ds} ind={ind} meta={meta} iso={p.c} obs={p.o} lang={lang} name={<span className="member">{countryName(p.c, lang)}</span>} />
      ))}
    </>
  );
}

export function EvidencePanel({ ds, lang, state }: { ds: Dataset; lang: Lang; state: State }) {
  const L = t(lang);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const ind = ds.indicators.find((i) => i.id === state.indicator)!;
  const { evidence: ev, meta, verification: ver } = ds.data[ind.id];
  const series = useMemo(() => buildSeries(ds, ind, state.country, state.comps, lang), [ds, ind, state.country, state.comps, lang]);
  const subject = series.find((s) => s.isSubject);
  const code = `get_observations(variable_dcid="${ind.dcid}", place_dcid="country/${state.country ?? "KEN"}", date="range", date_range_start="2000")`;
  const copy = (what: "link" | "code", text: string) => { navigator.clipboard?.writeText(text).then(() => { setCopied(what); setTimeout(() => setCopied(null), 1600); }); };
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const natureTotal = meta?.nature.reduce((a, n) => a + n.n, 0) ?? 0;

  const flags = [
    subject && !subject.latest && { tone: "limit" as const, text: `${L.noDataFor} ${subject.label}` },
    subject?.obs.length && isStale(subject.obs.at(-1)) && { tone: "limit" as const, text: `${subject.label}: ${L.stale}, ${subject.obs.at(-1)![0]}` },
    subject?.censored ? { tone: "note" as const, text: `${subject.label}: ${L.censoredHint} (${subject.censored})` } : null,
    ...series.filter((s) => s.group).flatMap((s) => { const n = s.group!.points.filter((p) => censoredText(ds, ind.id, p.c, p.o[0])).length; return n ? [{ tone: "note" as const, text: `${s.label}: ${L.censoredNote.replace("{n}", String(n))}` }] : []; }),
    ...series.filter((s) => s.group).map((s) => ({ tone: "note" as const, text: `${s.label}: ${L.members} ${s.group!.n}/${s.group!.total} · ${L.groupNote}` })),
    ...series.filter((s) => s.kind === "group" && !s.group).map((s) => ({ tone: "limit" as const, text: `${s.label}: ${L.noData}` })),
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
            <div className="ev-title"><h3 lang="en">{ind.name}</h3>{meta?.indicator && <span className="sdg-chip num">{L.sdg} {meta.indicator}</span>}</div>
            {meta?.indicatorTitle && <p className="ev-def" lang="en"><b>{L.officialTitle}:</b> {meta.indicatorTitle}</p>}
            {meta?.seriesDescription && <p className="ev-def" lang="en"><b>{L.dataset}:</b> {meta.seriesDescription} <span className="num">({meta.series})</span></p>}
            {meta?.targetText && <p className="ev-def" lang="en"><b>{L.officialTarget} {meta.target}:</b> {meta.targetText}</p>}
            <dl className="ev-dl">
              <div><dt>{L.unit}</dt><dd lang="en">{ind.unit}</dd></div>
              <div><dt>{L.source}</dt><dd lang="en">{ev.provenance}{meta?.release ? ` · ${L.release} ${meta.release}` : ""}</dd></div>
              <div><dt>{L.agencies}</dt><dd lang="en">{meta?.sources.slice(0, 3).map((s) => `${cleanSource(s.name)} (${s.n})`).join("; ") ?? L.notPublished}</dd></div>
              <div><dt>{L.natureCol}</dt><dd lang="en">{meta?.nature.length ? meta.nature.map((n) => `${n.label} ${pct(n.n / natureTotal)}`).join(" · ") : L.basisUnknown}</dd></div>
              <div><dt>{L.snapshotCheck}</dt><dd className="num">{ver ? <><b>{pct(ver.identicalRate)}</b> {L.identicalWord}, {pct(ver.within1pct / ver.checked)} ≤1%, n = {ver.checked.toLocaleString()}</> : "—"}</dd></div>
              <div><dt>{L.updated}</dt><dd>{L.notPublished}</dd></div>
              <div><dt>{L.retrieved}</dt><dd className="num">{ev.retrievedAt.slice(0, 10)}</dd></div>
              <div><dt>{L.dcid}</dt><dd className="mono">{ind.dcid}</dd></div>
            </dl>
            <div className="ev-links">
              <Ext href={ev.datasetUrl}>{L.dataLink}</Ext>
              <Ext href={ind.metaUrl}>{L.methodLink}</Ext>
              {meta?.dataUrl && <Ext href={meta.dataUrl}>{ind.dcid.startsWith("undata/sdg/") ? "SDG API" : "CSV"}</Ext>}
              <a className="ext" href="/verification">{L.verifyPage}</a>
            </div>
          </div>
          <div className="ev-side">
            <h4>{L.verifyTitle}</h4>
            <div className="tscroll">
              <table className="dtable ev-table">
                <thead><tr><th>{L.country}</th><th>{L.graphValue}</th><th>{meta?.latest ? L.officialNow : ""}</th><th>{L.natureCol}</th><th /></tr></thead>
                <tbody>{series.map((s) => <SeriesRows key={s.key} ds={ds} ind={ind} meta={meta} s={s} lang={lang} />)}</tbody>
              </table>
            </div>
            <ul className="ev-flags">{flags.map((f, i) => <li key={i}><ToneTag tone={f.tone} label="" /><span>{f.text}</span></li>)}</ul>
            <div className="ev-code">
              <div className="ev-code-head"><span>{L.reproduce}</span><button onClick={() => copy("code", code)}>{copied === "code" ? L.copied : L.copy}</button></div>
              <pre><code>{code}</code></pre>
            </div>
          </div>
        </div>
        <div className="ev-sources">
          {inView.map((s) => <Ext key={s.name} href={s.url}>{s.name} <b className="num">{s.n}</b></Ext>)}
          <Ext href={SDG_PORTAL}>{L.officialTitle}: SDG Global Database</Ext>
        </div>
      </div>
    </section>
  );
}
