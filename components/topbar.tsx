"use client";
import { countryName, type Lang, t } from "@/lib/i18n";
import { Combobox, type Option } from "./combobox";
import { LangMenu } from "./lang-menu";
import { ThemeToggle } from "./theme-toggle";

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="16" cy="16" r="12.5" />
      <ellipse cx="16" cy="16" rx="5.2" ry="12.5" opacity=".55" />
      <path d="M4 16h24M6.5 9.5h19M6.5 22.5h19" opacity=".35" />
      <circle cx="20.6" cy="11.2" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Topbar({ lang, country, options, onCountry, onLang }: { lang: Lang; country: string | null; options: Option[]; onCountry: (c: string) => void; onLang: (l: Lang) => void }) {
  const L = t(lang);
  return (
    <header className="topbar">
      <div className="topbar-in">
        <div className="brand"><BrandMark /><span className="brand-name">{L.brand}</span></div>
        <div className="top-spacer" />
        <Combobox options={options} placeholder={L.search} empty={L.noData} triggerClass="pick" onPick={(o) => onCountry(o.id)}
          trigger={<><span className="lbl">{L.country}</span><span>{country ? countryName(country, lang) : L.pickCountry}</span><svg className="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 6 4 4 4-4" /></svg></>} />
        <div className="top-actions"><LangMenu lang={lang} label={L.language} onChange={onLang} /><ThemeToggle label={L.theme} /></div>
      </div>
    </header>
  );
}
