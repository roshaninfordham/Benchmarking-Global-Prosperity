"use client";
import { useEffect, useState } from "react";

/** Eases a number up from zero when `key` changes. Snaps straight to the value if the viewer prefers reduced motion. */
export function useCountUp(target: number | undefined, key: string, ms = 900) {
  const [v, setV] = useState<number | undefined>(target);
  useEffect(() => {
    if (target === undefined) return setV(undefined);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(target);
    const t0 = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const k = Math.min(1, (now - t0) / ms);
      setV(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return v;
}
