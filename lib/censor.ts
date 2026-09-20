import type { Dataset } from "./types";

/** The official text ("<2.5") for a value the source publishes as a threshold, or undefined for a measured value. */
export const censoredText = (ds: Dataset, indicatorId: string, iso3: string, year: number): string | undefined => ds.data[indicatorId].censored?.[iso3]?.[year];
