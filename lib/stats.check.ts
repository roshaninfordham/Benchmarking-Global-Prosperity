// Run: node lib/stats.check.ts   (asserts against the compiled dataset)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { change, gap, groupSummary, median, quantile } from "./stats.ts";
import type { Dataset } from "./types.ts";

const ds: Dataset = JSON.parse(readFileSync("public/data/bgp.json", "utf8"));
const ind = ds.indicators.find((i) => i.id === "under-five-mortality")!;

assert.equal(median([3, 1, 2]), 2);
assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);

const ken = change(ds.data[ind.id].obs.KEN, ind)!;
assert.equal(ken.from[0], 2015);
assert.equal(ken.verdict, "better", "falling under-five mortality is an improvement");
assert.ok(ken.abs < 0);

const g = gap(38.8, 6.5, ind);
assert.equal(g.favourable, false, "higher mortality than the comparator is unfavourable");
assert.ok(Math.abs(g.ratio! - 5.97) < 0.01);

const ea = ds.groups.find((x) => x.id === "EasternAfrica")!;
const s = groupSummary(ds, ind, ea)!;
assert.ok(s.n >= 3 && s.q1 <= s.median && s.median <= s.q3);
console.log("stats ok");
