"use client";
import { useEffect, useRef, useState } from "react";

/** Width of an element, kept current with ResizeObserver, for responsive SVG charts. */
export function useWidth<T extends HTMLElement>(initial = 640) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el); setW(Math.max(280, el.clientWidth || initial));
    return () => ro.disconnect();
  }, [initial]);
  return [ref, w] as const;
}
