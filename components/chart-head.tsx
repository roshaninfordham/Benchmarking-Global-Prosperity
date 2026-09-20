import { t, type Lang } from "@/lib/i18n";
import type { Indicator } from "@/lib/types";

export function ChartHead({ ind, lang, table, onTable, extra }: { ind: Indicator; lang: Lang; table?: boolean; onTable?: (v: boolean) => void; extra?: React.ReactNode }) {
  const L = t(lang);
  return (
    <div className="chart-head">
      <div>
        <h3 className="chart-title" lang="en">{ind.name}</h3>
        <p className="chart-sub"><span lang="en">{ind.unit}</span><span className="dot-sep" aria-hidden />{ind.better === "lower" ? L.lowerBetter : L.higherBetter}</p>
      </div>
      <div className="chart-tools">
        {extra}
        {onTable && (
          <div className="seg" role="group" aria-label={`${L.chart} / ${L.table}`}>
            <button aria-pressed={!table} onClick={() => onTable(false)}>{L.chart}</button>
            <button aria-pressed={!!table} onClick={() => onTable(true)}>{L.table}</button>
          </div>
        )}
      </div>
    </div>
  );
}
