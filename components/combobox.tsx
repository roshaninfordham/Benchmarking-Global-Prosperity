"use client";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

export interface Option { id: string; label: string; hint?: string; section: string; kind: "country" | "group"; disabled?: boolean }

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Popover with a search field and a grouped listbox. The trigger is supplied by the caller. */
export function Combobox({ options, onPick, trigger, placeholder, empty, triggerClass = "" }: {
  options: Option[]; onPick: (o: Option) => void; trigger: ReactNode; placeholder: string; empty: string; triggerClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  const shown = useMemo(() => { const n = norm(q); return options.filter((o) => !n || norm(o.label).includes(n) || norm(o.hint ?? "").includes(n)).slice(0, 80); }, [options, q]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  useEffect(() => { document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, id]);

  const pick = (o?: Option) => { if (!o || o.disabled) return; onPick(o); setOpen(false); setQ(""); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(shown[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={root} className="combo">
      <button type="button" className={triggerClass} aria-haspopup="listbox" aria-expanded={open} onClick={() => { setActive(0); setOpen((o) => !o); }}>{trigger}</button>
      {open && (
        <div className="combo-panel" role="dialog">
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey} placeholder={placeholder} aria-label={placeholder}
            role="combobox" aria-expanded aria-controls={`${id}-list`} aria-activedescendant={shown.length ? `${id}-${active}` : undefined} className="combo-input" />
          <ul id={`${id}-list`} role="listbox" className="combo-list">
            {shown.map((o, i) => {
              const head = o.section !== shown[i - 1]?.section ? o.section : null;
              return (
                <li key={o.kind + o.id} role="presentation">
                  {head && <div className="combo-section">{head}</div>}
                  <div id={`${id}-${i}`} role="option" aria-selected={i === active} aria-disabled={o.disabled} data-active={i === active} onPointerMove={() => setActive(i)} onClick={() => pick(o)} className="combo-option">
                    <span>{o.label}</span>{o.hint && <span className="combo-hint">{o.hint}</span>}
                  </div>
                </li>
              );
            })}
            {!shown.length && <li className="combo-empty">{empty}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
