# Data sources

## What the app uses

| Source | Used for | How |
| --- | --- | --- |
| UN System Data Commons (MCP server, REST arcs) | Every plotted value; UN geographic groupings | `get_child_observations` per indicator; `->containedInPlace` per country |
| UN SDG Global Database API | Official titles, target text, reporting agencies, data-nature flags, uncertainty bounds, current values; independent check of 17 series | `Series/List`, `Goal/List`, `Series/Data` |
| UN SDG metadata repository | Methodology PDF for each indicator | Links resolved from the target listing page, then requested |
| UNDP Human Development Report Office | Life expectancy check and country link | Composite indices time series (CSV) |
| Natural Earth 1:10m countries, India point of view | Country shapes for the globe and flat map | `scripts/build-map.mjs` simplifies it to `public/map/world.json` (about 490 KB) |

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

## Country and group codes

Countries are identified by ISO 3166-1 alpha-3 codes, taken from the graph's own place identifiers (`country/KEN`). For countries the ISO numeric code is the same as the UN M49 code (Kenya is 404), and it is used to build the links to the SDG database. Groupings (UN sub-regions, continents, LDC, LLDC, SIDS, OECD, EU) come from the graph's `containedInPlace` hierarchy, not from a separate M49 file.

Compared with the M49 region tree published by the SDG API (2026-09-20, restricted to countries in this dataset), the graph uses the same region names and structure. 14 of the 32 groupings that could be paired by name have exactly the same countries (for example Africa, Oceania, Southern Asia, South-Eastern Asia, Western Asia and the landlocked developing countries). The others are subsets with 60% to 98% overlap: the graph omits some territories, and a few countries such as Greece have no sub-region in the responses we could retrieve. Least developed countries are 46 in the graph and 44 in M49, so a country that has graduated may still be listed in one of them.

## Map boundaries

The globe draws India's boundary as India depicts it, using Natural Earth's India point of view: all of Jammu and Kashmir and Ladakh, and Arunachal Pradesh. Other countries draw parts of these areas differently, so the map carries a note that the boundaries shown do not imply endorsement or acceptance by the United Nations. Every piece of land is kept. Pieces under about 160 km² (all 11 Lakshadweep islands, the Maldives, most small islands: 2,974 in all, 29 of them Indian) are too small to survive simplification, so each is stored as a point and drawn as a dot. India's border and coastline are kept at full source detail, including the Andaman and Nicobar islands.

## Things found while building

- `search_indicators` with a `places` argument returned HTTP 500 during the build (`failed to resolve place names ... REQUEST_DENIED`, a Google Maps legacy API error on the server). Searching without `places` works, so indicators were found that way and country availability was checked with observations.
- The REST arcs answered 403 for a few large or repeated requests (for Greece and Slovenia even singly). Their UN sub-region membership is missing, so those two countries appear only in continent and organisation groupings where the graph lists them.
- Search returns many disaggregated variants of one indicator (by sex, age, education level, urbanisation). The curated registry pins the total variant.
- Units come back as identifiers (`undata/UNIT_MEASURE-...`). The registry holds the display unit.
- The graph's country names differ from UN short names in a few cases (for example "Congo [DRC]"). Names shown in the app come from ISO country names with UN short-name overrides.
