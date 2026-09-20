# Metrics

Everything here was measured or counted. Where a figure is derived, the derivation is stated. Data pulled 2026-09-20.

## Data

| Measure | Value | Source |
| --- | ---: | --- |
| Curated indicators | 18 | `data/registry.json` |
| Prosperity dimensions | 4 | food, poverty, health, education |
| Observations | 48,089 | `docs/metrics.json` |
| Areas with at least one observation | 228 | `docs/metrics.json` |
| Areas with all 18 indicators | 60 | `docs/metrics.json` |
| Median indicators per area | 16 | `docs/metrics.json` |
| Latest observations from 2021 or later | 80% | `docs/metrics.json` |
| UN geographic groupings offered | 35 | sub-regions, continents, LDC, LLDC, SIDS, OECD, EU |

## Verification

| Measure | Value |
| --- | ---: |
| Observations compared with the official publisher | 48,089 (100%) |
| Identical | 45,178 (94.0%) |
| Within 1% | 45,359 (94.3%) |
| Series that match exactly | 15 of 18 |
| Methodology links checked and opening | 17 of 17 SDG links, plus UNDP |

## Speed, production deployment

| Measure | Value | Method |
| --- | ---: | --- |
| Time to first byte | 22 ms | Chrome DevTools trace, no throttling |
| Largest contentful paint | 376 ms | same trace |
| Cumulative layout shift | 0.00 | same trace |
| All data, compressed | 243 KB | `payloadGzipBytes` in `docs/metrics.json` |
| Data requests after first load | 0 | browser network log across country, comparator and view changes |
| Lighthouse, desktop and mobile | 100 / 100 / 100 | accessibility, best practices, SEO |

## Work saved

Answering "where does this country stand, against the US and its region, and where are the gaps" with the MCP tools directly follows the server's own three-step playbook: search, check metadata, fetch observations.

| | Tool calls | Basis |
| --- | ---: | --- |
| Directly, one country, two comparators, 18 indicators | 90 | 18 searches, 18 metadata checks, 54 observation calls (derived) |
| In this app | 0 after first load | one static file |

Individual MCP calls took 0.35 to 1.3 s in the pull runs, so the direct route is about a minute or two of waiting before any comparison, charting or source checking. This is a derived comparison, not a user study.

Curating the 18 indicators took more than 40 search and probe calls. The registry records that work once.

## Code

About 2,750 lines of TypeScript, CSS and scripts across the app and the data pipeline.
