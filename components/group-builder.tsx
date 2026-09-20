"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { countryName, t, type Lang } from "@/lib/i18n";

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Pick any set of countries to compare against as a group. The group is summarised by its median. */
export function GroupBuilder({ lang, countries, onAdd }: { lang: Lang; countries: string[]; onAdd: (iso3: string[]) => void }) {
  const L = t(lang);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const names = useMemo(() => { const col = new Intl.Collator(lang); return countries.map((c) => ({ c, n: countryName(c, lang) })).sort((a, b) => col.compare(a.n, b.n)); }, [countries, lang]);
  const shown = names.filter((x) => !q || norm(x.n).includes(norm(q))).slice(0, 80);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const add = () => { onAdd(picked); setOpen(false); setPicked([]); setQ(""); };

  return (
    <div ref={root} className="combo">
      <button type="button" className="pick pick-ghost" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><circle cx="5.5" cy="6" r="2.2" /><circle cx="11" cy="6.5" r="1.8" /><path d="M1.5 13c.3-2.3 1.9-3.5 4-3.5s3.7 1.2 4 3.5M10 9.6c2 0 3.6.9 4.4 3" strokeLinecap="round" /></svg>
        {L.buildGroup}
      </button>
      {open && (
        <div className="combo-panel gb-panel" role="dialog" aria-label={L.buildGroup}>
          <input className="combo-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.search} aria-label={L.search} autoFocus />
          <p className="gb-hint">{L.buildGroupHint}</p>
          <ul className="combo-list gb-list">
            {shown.map(({ c, n }) => (
              <li key={c}><label className="gb-item"><input type="checkbox" checked={picked.includes(c)} onChange={() => toggle(c)} /><span>{n}</span></label></li>
            ))}
          </ul>
          <div className="gb-foot">
            <span className="num">{picked.length} {L.chosen}</span>
            <button className="pick" disabled={picked.length < 3} onClick={add}>{L.addGroup}</button>
          </div>
        </div>
      )}
    </div>
  );
}
