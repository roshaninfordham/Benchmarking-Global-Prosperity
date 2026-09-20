import { isLang, type Lang } from "./i18n";
import type { Comparator } from "./types";

export type View = "overview" | "baseline" | "compare" | "trend" | "map";
export const VIEWS: View[] = ["overview", "baseline", "compare", "trend", "map"];
export const MAX_COMPARATORS = 3;

export interface State { lang: Lang; country: string | null; comps: Comparator[]; indicator: string; view: View; dim: string }

export const DEFAULT_STATE: State = {
  lang: "en", country: "KEN", indicator: "under-five-mortality", view: "overview", dim: "all",
  comps: [{ kind: "country", id: "USA" }, { kind: "group", id: "EasternAfrica" }],
};

const enc = (c: Comparator) => (c.kind === "group" ? `g:${c.id}` : c.kind === "custom" ? `x:${c.id}` : c.id);
const dec = (s: string): Comparator => (s.startsWith("g:") ? { kind: "group", id: s.slice(2) } : s.startsWith("x:") ? { kind: "custom", id: s.slice(2) } : { kind: "country", id: s });

export function toQuery(s: State): string {
  const p = new URLSearchParams();
  if (s.country) p.set("c", s.country);
  if (s.comps.length) p.set("vs", s.comps.map(enc).join(","));
  p.set("i", s.indicator);
  p.set("v", s.view);
  if (s.dim !== "all") p.set("d", s.dim);
  if (s.lang !== "en") p.set("lang", s.lang);
  return p.toString();
}

export function fromQuery(q: string, valid: { indicators: string[]; countries: string[]; groups: string[]; dims: string[] }): State {
  const p = new URLSearchParams(q);
  if (![...p.keys()].length) return DEFAULT_STATE;
  const lang = p.get("lang");
  const country = p.get("c");
  const view = p.get("v") as View;
  const ind = p.get("i");
  return {
    lang: isLang(lang) ? lang : "en",
    country: country && valid.countries.includes(country) ? country : null,
    comps: (p.get("vs")?.split(",").filter(Boolean).map(dec) ?? []).filter((c) => (c.kind === "country" ? valid.countries.includes(c.id) : c.kind === "custom" ? c.id.split("+").length >= 3 && c.id.split("+").every((m) => valid.countries.includes(m)) : valid.groups.includes(c.id))).slice(0, MAX_COMPARATORS),
    indicator: ind && valid.indicators.includes(ind) ? ind : DEFAULT_STATE.indicator,
    view: VIEWS.includes(view) ? view : "overview",
    dim: p.get("d") && valid.dims.includes(p.get("d")!) ? p.get("d")! : "all",
  };
}
