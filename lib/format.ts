import { countryName, fmt, t, type Lang } from "./i18n";
import type { Comparator, Dataset, Indicator } from "./types";

/** Short suffix used after a figure inside running text. */
export const unitSuffix = (ind: Indicator, lang: Lang) => (ind.unit.startsWith("%") ? "%" : ind.unit === "years" ? t(lang).yrs : "");
export const valueText = (ind: Indicator, v: number, lang: Lang) => `${fmt(v, lang)}${unitSuffix(ind, lang)}`;

export const membersOf = (ds: Dataset, c: Comparator): string[] =>
  c.kind === "country" ? [c.id] : c.kind === "custom" ? c.id.split("+").filter(Boolean) : (ds.groups.find((g) => g.id === c.id)?.members ?? []);

export function nameOf(ds: Dataset, c: Comparator, lang: Lang): string {
  if (c.kind === "country") return countryName(c.id, lang);
  if (c.kind === "custom") return `${t(lang).customGroup} (${membersOf(ds, c).length})`;
  return ds.groups.find((g) => g.id === c.id)?.name ?? c.id;
}

/** Series colour slot for the subject (0) and up to three comparators. */
export const SERIES = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"] as const;
