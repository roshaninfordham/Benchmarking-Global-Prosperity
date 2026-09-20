import { line } from "d3-shape";
import type { Obs } from "@/lib/types";

/** Small trend line. Solid where observations are close together, dashed across gaps, a dot on every observation. */
export function Sparkline({ obs, w = 140, h = 40, color = "var(--s1)", from = 2000, to = 2026 }: { obs: Obs[]; w?: number; h?: number; color?: string; from?: number; to?: number }) {
  const pts = obs.filter((o) => o[0] >= from);
  if (pts.length < 2) return pts.length ? <svg width={w} height={h} aria-hidden><circle cx={w - 6} cy={h / 2} r="3.5" fill={color} /></svg> : <svg width={w} height={h} aria-hidden />;
  const min = Math.min(...pts.map((p) => p[1])), max = Math.max(...pts.map((p) => p[1])), pad = 5;
  const x = (y: number) => pad + ((y - from) / (to - from)) * (w - pad * 2);
  const y = (v: number) => (max === min ? h / 2 : h - pad - ((v - min) / (max - min)) * (h - pad * 2));
  const gen = line<Obs>().x((p) => x(p[0])).y((p) => y(p[1]));
  const segs: { d: string; dashed: boolean }[] = [];
  for (let i = 1; i < pts.length; i++) segs.push({ d: gen([pts[i - 1], pts[i]])!, dashed: pts[i][0] - pts[i - 1][0] > 3 });
  const last = pts.at(-1)!;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ overflow: "visible" }}>
      {segs.map((s, i) => <path key={i} d={s.d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={s.dashed ? "2 4" : undefined} />)}
      {pts.length <= 14 && pts.slice(0, -1).map((p) => <circle key={p[0]} cx={x(p[0])} cy={y(p[1])} r="2.2" fill={color} />)}
      <circle cx={x(last[0])} cy={y(last[1])} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}
