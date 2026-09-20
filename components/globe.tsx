"use client";
import { geoCentroid, geoContains, geoGraticule10, geoNaturalEarth1, geoOrthographic, geoPath } from "d3-geo";
import { interpolateLab } from "d3-interpolate";
import { scaleLinear } from "d3-scale";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { valueText } from "@/lib/format";
import { countryName, type Lang } from "@/lib/i18n";
import { loadCountries, type CountryFeature } from "@/lib/geo";
import { allLatest, quantile } from "@/lib/stats";
import type { Comparator, Dataset, Indicator, Obs } from "@/lib/types";

interface Props {
  ds: Dataset; ind: Indicator; lang: Lang; subject: string | null; comps: Comparator[];
  flat?: boolean; interactive?: boolean; onPick?: (iso3: string, additive: boolean) => void; className?: string;
  /** Aspect ratio of the canvas box: 1 for a globe, 2 for a flat map. */
  ratio?: number;
}

export interface Ramp { scale: (v: number) => string; lo: number; mid: number; hi: number }

/** Quantile-stretched ramp so skewed indicators still show structure. Reads the theme's ramp colours. */
export function makeRamp(values: number[], lo: string, hi: string): Ramp {
  const q = [0, 0.25, 0.5, 0.75, 1].map((p) => quantile(values, p));
  const dom = q.map((x, i) => (i && x <= q[i - 1] ? q[i - 1] + 1e-9 * i : x));
  const s = scaleLinear<string>().domain(dom).range([0, 0.25, 0.5, 0.75, 1].map((t) => interpolateLab(lo, hi)(t))).interpolate(interpolateLab).clamp(true);
  return { scale: (v) => s(v), lo: q[0], mid: q[2], hi: q[4] };
}

const PAD = 30; // room for the atmosphere glow inside the canvas
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function Globe({ ds, ind, lang, subject, comps, flat = false, interactive = true, onPick, className, ratio }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const feats = useRef<CountryFeature[]>([]);
  const rot = useRef<[number, number, number]>([80, -12, 0]);
  const raf = useRef(0);
  const drag = useRef<{ x: number; y: number; r: [number, number, number]; moved: boolean } | null>(null);
  const [ready, setReady] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; iso: string } | null>(null);

  const latestVals = useMemo(() => allLatest(ds, ind), [ds, ind]);
  const P = useRef({ latestVals, subject, comps, flat, ind, ds });
  P.current = { latestVals, subject, comps, flat, ind, ds };

  const draw = useCallback(() => {
    const c = cv.current;
    if (!c || !feats.current.length) return;
    const ctx = c.getContext("2d")!, dpr = window.devicePixelRatio || 1;
    const W = c.width / dpr, H = c.height / dpr;
    const { latestVals, subject, comps, flat, ds } = P.current;
    const cs = getComputedStyle(c), v = (n: string) => cs.getPropertyValue(n).trim();
    if (!v("--glow")) return; // stylesheet not applied yet
    const dark = document.documentElement.dataset.theme === "dark";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const proj = flat ? geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], { type: "Sphere" }) : geoOrthographic().rotate(rot.current).scale(Math.min(W, H) / 2 - PAD).translate([W / 2, H / 2]).clipAngle(90);
    const path = geoPath(proj, ctx);
    const r = Math.min(W, H) / 2 - PAD;

    if (!flat) { // atmosphere
      const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.96, W / 2, H / 2, r * 1.18);
      g.addColorStop(0, v("--glow")); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, H / 2, r * 1.18, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = v("--ocean"); ctx.fill();
    ctx.beginPath(); path(geoGraticule10()); ctx.strokeStyle = v("--line"); ctx.lineWidth = 0.6; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1;

    const vals = Object.values(latestVals).map((o) => o[1]);
    const ramp = vals.length > 3 ? makeRamp(vals, v("--ramp-lo"), v("--ramp-hi")) : null;
    const hatch = document.createElement("canvas"); hatch.width = hatch.height = 6;
    const hx = hatch.getContext("2d")!; hx.fillStyle = v("--land-empty"); hx.fillRect(0, 0, 6, 6); hx.strokeStyle = v("--line-strong"); hx.globalAlpha = 0.7; hx.lineWidth = 1; hx.beginPath(); hx.moveTo(0, 6); hx.lineTo(6, 0); hx.stroke();
    const hatchFill = ctx.createPattern(hatch, "repeat")!;

    for (const f of feats.current) {
      ctx.beginPath(); path(f);
      const o = f.iso3 ? latestVals[f.iso3] : undefined;
      ctx.fillStyle = o && ramp ? ramp.scale(o[1]) : hatchFill;
      ctx.fill(); ctx.strokeStyle = v("--surface"); ctx.lineWidth = 0.5; ctx.stroke();
    }

    const mark = (isos: Set<string>, color: string, w: number, glow: number) => {
      ctx.save(); ctx.lineJoin = "round"; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.shadowColor = color; ctx.shadowBlur = glow;
      for (const f of feats.current) if (f.iso3 && isos.has(f.iso3)) { ctx.beginPath(); path(f); ctx.stroke(); }
      ctx.restore();
    };
    comps.forEach((c, i) => {
      const members = c.kind === "country" ? [c.id] : (ds.groups.find((g) => g.id === c.id)?.members ?? []);
      mark(new Set(members), v(`--s${i + 2}`), c.kind === "group" ? 0.9 : 1.8, c.kind === "group" ? 0 : dark ? 10 : 4);
    });
    if (subject) mark(new Set([subject]), v("--s1"), 2.4, dark ? 18 : 8);

    ctx.beginPath(); path({ type: "Sphere" }); ctx.strokeStyle = v("--line-strong"); ctx.lineWidth = 1; ctx.stroke();
  }, []);

  // Load shapes once.
  useEffect(() => { let live = true; loadCountries().then((f) => { if (live) { feats.current = f; setReady(true); } }); return () => { live = false; }; }, []);

  // Size the canvas to its box.
  useEffect(() => {
    const el = box.current!, c = cv.current!;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1, w = el.clientWidth, h = el.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); draw();
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    const mo = new MutationObserver(draw); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [draw, ready]);

  // Redraw when data or selection changes.
  useEffect(draw, [draw, latestVals, subject, comps, flat, ready]);

  // Rotate to the selected country. On first load the globe spins in from the side.
  const first = useRef(true);
  useEffect(() => {
    if (flat || !ready || !subject) return;
    const f = feats.current.find((x) => x.iso3 === subject);
    if (!f) return;
    const [lon, lat] = geoCentroid(f);
    const from = [...rot.current] as [number, number, number], to: [number, number, number] = [-lon, -lat * 0.85, 0];
    let d = to[0] - from[0]; d = ((d + 540) % 360) - 180; // shortest way round
    const dur = first.current ? 2200 : 1100; first.current = false;
    const t0 = performance.now();
    cancelAnimationFrame(raf.current);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), e = ease(k);
      rot.current = [from[0] + d * e, from[1] + (to[1] - from[1]) * e, 0]; draw();
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { rot.current = to; draw(); } else raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [subject, flat, ready, draw]);

  const hit = (e: React.PointerEvent): CountryFeature | undefined => {
    const c = cv.current!, rect = c.getBoundingClientRect(), W = rect.width, H = rect.height;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const proj = P.current.flat ? geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], { type: "Sphere" }) : geoOrthographic().rotate(rot.current).scale(Math.min(W, H) / 2 - PAD).translate([W / 2, H / 2]).clipAngle(90);
    const ll = proj.invert?.([x, y]);
    if (!ll || (!P.current.flat && Math.hypot(x - W / 2, y - H / 2) > Math.min(W, H) / 2 - PAD)) return;
    return feats.current.find((f) => geoContains(f, ll));
  };

  const onDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    cancelAnimationFrame(raf.current);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, r: [...rot.current], moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!interactive) return;
    const d = drag.current;
    if (d && !P.current.flat) {
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      rot.current = [d.r[0] + dx * 0.35, Math.max(-80, Math.min(80, d.r[1] - dy * 0.35)), 0]; draw(); setTip(null); return;
    }
    const f = hit(e), rect = cv.current!.getBoundingClientRect();
    setTip(f?.iso3 ? { x: e.clientX - rect.left, y: e.clientY - rect.top, iso: f.iso3 } : null);
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null;
    if (!interactive || !d || d.moved) return;
    const f = hit(e);
    if (f?.iso3 && onPick) onPick(f.iso3, e.shiftKey || e.metaKey);
  };

  const tipVal = tip ? latestVals[tip.iso] as Obs | undefined : undefined;
  return (
    <div ref={box} className={`globe ${className ?? ""}`} style={{ aspectRatio: String(ratio ?? (flat ? 2 : 1)) }}>
      <canvas ref={cv} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => { setTip(null); }} style={{ cursor: !interactive ? "default" : flat ? "pointer" : drag.current ? "grabbing" : "grab", touchAction: "none" }} aria-hidden={!interactive} />
      {tip && (
        <div className="tip" style={{ left: tip.x, top: tip.y }} role="status">
          <b>{countryName(tip.iso, lang)}</b>
          <span className="num">{tipVal ? `${valueText(ind, tipVal[1], lang)} · ${tipVal[0]}` : "—"}</span>
        </div>
      )}
    </div>
  );
}
