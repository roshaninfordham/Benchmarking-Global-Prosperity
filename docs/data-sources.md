# Data sources

## What the app uses

| Source | Used for | How |
| --- | --- | --- |
| UN System Data Commons (MCP server, REST arcs) | Every plotted value; UN geographic groupings | `get_child_observations` per indicator; `->containedInPlace` per country |
| UN SDG Global Database API | Official titles, target text, reporting agencies, data-nature flags, uncertainty bounds, current values; independent check of 17 series | `Series/List`, `Goal/List`, `Series/Data` |
| UN SDG metadata repository | Methodology PDF for each indicator | Links resolved from the target listing page, then requested |
| UNDP Human Development Report Office | Life expectancy check and country link | Composite indices time series (CSV) |

## Is HDX in the graph?

No. Every observation returned by the graph carries a UN provenance: SDG, ILO, WHO, UNICEF, UNHCR, UNAIDS, UNDP HDRO and similar. None carries a Humanitarian Data Exchange provenance. HDX is therefore out of scope for this version. The specification says HDX may be incorporated later, and the registry format would accept it as a further source.

## The graph is behind the SDG database for some series

Where the graph and the official database disagree, the app shows both. Four of the 18 series differ in the 2026-09-20 pull:

| Series | Identical | Why it differs |
| --- | ---: | --- |
| Undernourishment | 35.0% | Revised FAO estimates, plus a newer year at source for 100 countries |
| Severe food insecurity | 91.3% | Newer year at source for 124 countries |
| Extreme poverty | 88.2% | Revised estimates, newer year at source for 70 countries |
| Life expectancy | 99.0% | 68 of 6,630 values differ from the UNDP file |

All other series match exactly. See `data/verification.json` for every count.

## Values published as thresholds

Some official values are thresholds, not measurements. FAO reports undernourishment for many high-income countries as `<2.5`. The graph stores the bare number `2.5`, which reads as a measurement. The app reads the threshold from the SDG database, shows it as `<2.5`, and never builds a gap, ratio or change from it. 1,159 observations across undernourishment and severe food insecurity are thresholds; 86 more are missing at source.

## Things found while building

- `search_indicators` with a `places` argument returned HTTP 500 during the build (`failed to resolve place names ... REQUEST_DENIED`, a Google Maps legacy API error on the server). Searching without `places` works, so indicators were found that way and country availability was checked with observations.
- The REST arcs answered 403 for a few large or repeated requests (for Greece and Slovenia even singly). Their UN sub-region membership is missing, so those two countries appear only in continent and organisation groupings where the graph lists them.
- Search returns many disaggregated variants of one indicator (by sex, age, education level, urbanisation). The curated registry pins the total variant.
- Units come back as identifiers (`undata/UNIT_MEASURE-...`). The registry holds the display unit.
- The graph's country names differ from UN short names in a few cases (for example "Congo [DRC]"). Names shown in the app come from ISO country names with UN short-name overrides.
