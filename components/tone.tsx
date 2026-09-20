import type { Tone } from "@/lib/insights";

const COLOR: Record<Tone, string> = { ahead: "var(--good)", better: "var(--good)", behind: "var(--bad)", worse: "var(--bad)", flat: "var(--ink-3)", limit: "var(--warn)", note: "var(--accent-ink)" };

/**
 * Icon + label, so status never depends on colour alone.
 * Change tones point the way the number moved (`dir`); colour says whether that is good.
 * Ahead and behind use chevrons that match the "more favourable is right" axes.
 */
export function ToneTag({ tone, label, dir }: { tone: Tone; label: string; dir?: "up" | "down" }) {
  const d = dir ?? (tone === "better" ? "up" : "down");
  return (
    <span className="tone" style={{ color: COLOR[tone] }}>
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {(tone === "better" || tone === "worse") && (d === "up" ? <path d="M8 13V3m0 0L4 7m4-4 4 4" /> : <path d="M8 3v10m0 0-4-4m4 4 4-4" />)}
        {tone === "ahead" && <path d="m3.5 4 4 4-4 4M8.5 4l4 4-4 4" />}
        {tone === "behind" && <path d="m12.5 4-4 4 4 4M7.5 4l-4 4 4 4" />}
        {tone === "flat" && <path d="M3 8h10" />}
        {tone === "limit" && <><path d="M8 2.5 14 13H2L8 2.5Z" /><path d="M8 7v3M8 11.6v.1" /></>}
        {tone === "note" && <><circle cx="8" cy="8" r="6" /><path d="M8 7.5V11M8 5v.1" /></>}
      </svg>
      {label}
    </span>
  );
}
