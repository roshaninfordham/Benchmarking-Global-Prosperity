"use client";
import { LANGS, type Lang } from "@/lib/i18n";

export function LangMenu({ lang, label, onChange }: { lang: Lang; label: string; onChange: (l: Lang) => void }) {
  return (
    <label className="lang-menu">
      <span className="sr-only">{label}</span>
      <select value={lang} onChange={(e) => onChange(e.target.value as Lang)} aria-label={label}>
        {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
      </select>
    </label>
  );
}
