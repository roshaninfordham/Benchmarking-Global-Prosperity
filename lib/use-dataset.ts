"use client";
import { useCallback, useEffect, useState } from "react";
import type { Dataset } from "./types";

let cache: Promise<Dataset> | undefined;
const load = () => (cache ??= fetch("/data/bgp.json").then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).catch((e) => { cache = undefined; throw e; }));

export function useDataset() {
  const [ds, setDs] = useState<Dataset>();
  const [failed, setFailed] = useState(false);
  const run = useCallback(() => { setFailed(false); load().then(setDs, () => setFailed(true)); }, []);
  useEffect(run, [run]);
  return { ds, failed, retry: run };
}
