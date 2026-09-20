# Design decisions

The interface makes uncertainty visible. Observation years, gaps between observations, older-than-five-years data and missing values are drawn as marks, not hidden in footnotes.

## Structure

| Area | Job | Where |
| --- | --- | --- |
| Insight | Say what the data shows, in a few lines | `components/insight-panel.tsx`, `lib/insights.ts` |
| Visualisation | Show it, with the same selection driving every view | `components/viz-panel.tsx` and the views it hosts |
| Sources & evidence | Let anyone check it | `components/evidence-panel.tsx`, `app/verification/page.tsx` |

A rail along the left edge joins the three areas. Selecting a finding sends a pulse down it, moves the chart to that indicator and updates the evidence below.

## Views

| View | Question it answers |
| --- | --- |
| Overview | Where does this country stand on every curated indicator? |
| Baseline | How far is it from the median country on each indicator? Rows are never summed into a score. |
| Compare | How does it compare with chosen countries or UN groupings, and where does it sit among all countries? |
| Trend | How has it changed, against the 2015 baseline and any numeric SDG target? |
| Map | Where in the world are the high and low values? Drag the globe, click a country to select it. |

## Colour

- Series colours are the four leading slots of the reference data-visualisation palette, checked with its validator on this app's own surfaces.
  - Light, surface `#fbfcfd`: worst adjacent colour-blind separation ΔE 9.1, normal-vision ΔE 22.9. Contrast against the surface is below 3:1 for aqua and yellow, so every series is also direct-labelled and every chart has a table view.
  - Dark, surface `#0f1b2a`: worst adjacent colour-blind separation ΔE 8.4, normal-vision ΔE 19.8, all colours at least 3:1.
- Blue is both the subject colour and the map's magnitude ramp. The selected country on the map is therefore outlined in ink, not blue.
- Green and red-orange mark favourable and unfavourable only, always with an icon and a word.
- No overall score, no league table, no rank numbers.

## Type

IBM Plex Sans for text, IBM Plex Sans Condensed for headlines and large figures, IBM Plex Sans Arabic for Arabic. Chinese falls back to the system CJK face. Numerals are tabular wherever they line up.

## Motion

- One orchestrated moment: on load the globe spins in and settles on the country while the figures count up.
- Motion that answers an action: tab highlight slides, bars and dots travel to new values, the globe turns to a newly selected country, the trace pulse runs.
- Everything respects `prefers-reduced-motion`.

## Accessibility

- Every chart has a table twin. Tooltips never hold information that is unavailable elsewhere.
- Status is never colour alone. Keyboard focus is always visible. The country picker is a labelled combobox.
- Six languages including right-to-left Arabic. English names are isolated inside Arabic sentences so they do not reorder the text around them.
