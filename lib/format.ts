import { countryName, fmt, type Lang } from "./i18n";
import type { Comparator, Dataset, Indicator } from "./types";

/** Short suffix used after a figure inside running text. */
export const unitSuffix = (ind: Indicator) => (ind.unit.startsWith("%") ? "%" : ind.unit === "years" ? " yrs" : "");
export const valueText = (ind: Indicator, v: number, lang: Lang) => `${fmt(v, lang)}${unitSuffix(ind)}`;

export function nameOf(ds: Dataset, c: Comparator, lang: Lang): string {
  return c.kind === "country" ? countryName(c.id, lang) : (ds.groups.find((g) => g.id === c.id)?.name ?? c.id);
}
export const membersOf = (ds: Dataset, c: Comparator): string[] => (c.kind === "country" ? [c.id] : (ds.groups.find((g) => g.id === c.id)?.members ?? []));

/** Series colour slot for the subject (0) and up to three comparators. */
export const SERIES = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"] as const;
