"use client";
import { useEffect, useState } from "react";
import type { Dataset } from "./types";

let cache: Promise<Dataset> | undefined;
const load = () => (cache ??= fetch("/data/bgp.json").then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).catch((e) => { cache = undefined; throw e; }));

export function useDataset() {
  const [ds, setDs] = useState<Dataset>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    load().then((d) => live && setDs(d), () => live && setFailed(true));
    return () => { live = false; };
  }, [attempt]);
  return { ds, failed, retry: () => { setFailed(false); setAttempt((a) => a + 1); } };
}
