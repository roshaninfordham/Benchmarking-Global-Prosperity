"use client";
import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
};
const isDark = () => document.documentElement.dataset.theme === "dark";

export function ThemeToggle({ label }: { label: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("bgp-theme", next); } catch {}
  };
  return (
    <button onClick={flip} aria-label={label} aria-pressed={dark} className="theme-toggle" title={label}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <circle cx="12" cy="12" r={dark ? 5.5 : 4.2} fill="currentColor" style={{ transition: "r .4s" }} />
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ opacity: dark ? 0 : 1, transform: dark ? "rotate(45deg) scale(.4)" : "none", transformOrigin: "12px 12px", transition: "all .4s cubic-bezier(.3,1.4,.5,1)" }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="12" y1="2.6" x2="12" y2="5" transform={`rotate(${a} 12 12)`} />)}
        </g>
        <circle cx={dark ? 16.5 : 24} cy={dark ? 8.5 : 2} r="5.2" style={{ fill: "var(--surface)", transition: "all .45s cubic-bezier(.3,1.2,.5,1)" }} />
      </svg>
    </button>
  );
}
