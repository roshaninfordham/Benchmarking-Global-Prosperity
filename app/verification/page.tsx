import type { Metadata } from "next";
import Link from "next/link";
import registry from "@/data/registry.json";
import verification from "@/data/verification.json";
import { BrandMark } from "@/components/topbar";

export const metadata: Metadata = { title: "How values are verified | Benchmarking Global Prosperity" };

type Row = { source: string; checked: number; identical: number; within1pct: number; absentInApi: number; identicalRate: number; medianRelativeDifference?: number; countriesWithNewerYearInApi?: number };
const results = verification.results as Record<string, Row>;
const pct = (x: number) => `${(x * 100).toFixed(x === 1 ? 0 : 1)}%`;

export default function Page() {
  const t = verification.totals;
  return (
    <main className="vpage">
      <Link href="/" className="vback"><BrandMark />Benchmarking Global Prosperity</Link>
      <h1 className="display">How values are verified</h1>
      <p className="vlead">Every number in this app comes from the UN System Data Commons graph. After each data pull, every observation is compared with the official publisher of the series. Nothing is adjusted, and differences are reported rather than hidden.</p>

      <section className="vstats">
        <div><b className="display num">{t.checked.toLocaleString()}</b><span>observations checked</span></div>
        <div><b className="display num">{pct(t.identicalRate)}</b><span>identical to the official source</span></div>
        <div><b className="display num">{pct(t.within1pctRate)}</b><span>within 1% of it</span></div>
      </section>

      <section className="card vcard">
        <h2>Checks by indicator</h2>
        <div className="tscroll">
          <table className="dtable">
            <thead><tr><th>Indicator</th><th>Compared with</th><th>Checked</th><th>Identical</th><th>Within 1%</th><th>Not in source</th><th>Countries with a newer year at source</th></tr></thead>
            <tbody>
              {registry.indicators.map((i) => { const r = results[i.id]; return r ? (
                <tr key={i.id}><td>{i.short}</td><td>{r.source}</td><td className="num">{r.checked.toLocaleString()}</td><td className="num">{pct(r.identicalRate)}</td><td className="num">{pct(r.within1pct / r.checked)}</td><td className="num">{r.absentInApi.toLocaleString()}</td><td className="num">{r.countriesWithNewerYearInApi ?? "n/a"}</td></tr>
              ) : null; })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="vcols">
        <div className="card vcard">
          <h2>Method</h2>
          <ol>
            <li>Series and countries are read from the UN System Data Commons MCP server (<code>get_child_observations</code>).</li>
            <li>The same series is requested from the <a href="https://unstats.un.org/sdgapi/v1/sdg/Series/List" target="_blank" rel="noreferrer noopener">UN SDG Global Database API</a>, using the graph variable&apos;s own disaggregation (for example age under 5).</li>
            <li>Each observation is matched by country and year. Values are identical when they agree to six significant places.</li>
            <li>Life expectancy is not an SDG series, so it is compared with UNDP&apos;s <a href="https://hdr.undp.org/data-center/documentation-and-downloads" target="_blank" rel="noreferrer noopener">composite indices time series</a>.</li>
            <li>Titles, target text, reporting agencies and data-nature flags shown in the app are read from the SDG API, not written by hand.</li>
          </ol>
          <p className="vnote">Re-run with <code>node scripts/verify.mjs</code>. Results are stored in <code>data/verification.json</code>.</p>
        </div>
        <div className="card vcard">
          <h2>What differences mean</h2>
          <p>The graph is a snapshot. Where values differ, the official database has usually been revised or has added a newer year since the graph was loaded. The Sources area shows both values side by side and links to the current official value for each country.</p>
          <p>Humanitarian Data Exchange data is not part of this graph: no observation carries an HDX provenance, so HDX is out of scope for this version.</p>
        </div>
      </section>
    </main>
  );
}
