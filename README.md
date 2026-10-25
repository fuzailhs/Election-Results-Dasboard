# Election Results Dashboard

A neutral, read-only React and TypeScript dashboard for the official 2021 Canadian federal election results. The app loads a preprocessed local JSON file, validates it before calculating any totals, and works without a backend, account, analytics, or live API at runtime.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

## Data source and update

The included dataset uses Elections Canada's **Table 8: Number of valid votes by political affiliation** for the 44th General Election. It contains all 13 province and territory columns and all listed affiliations. The source page is [Elections Canada — Official Voting Results](https://www.elections.ca/content.aspx?section=res&dir=rep/off/44gedata&document=index&lang=e); the source table is [Table 8](https://www.elections.ca/res/rep/off/ovr2021app/53/table8E.html).

To refresh the bundled JSON from this fixed official table:

```sh
npm run data:update
```

The updater checks the table headers, rejects unusable vote values, and verifies both each affiliation's Canada sum and every area total against Elections Canada's published totals. It excludes the table's aggregate “Totals” row from party records. It writes `public/data/election-results.json`. It does not silently discard invalid rows. The selected table has no eligible-voter denominator or candidate-level records, so turnout and candidate details are not estimated or shown as if provided.

Area labels, party labels, and zero counts are retained from the official table. Each area's `Final` status reflects the completed official voting-results publication. The table's official update date is recorded as October 31, 2023.

## Routes

- `/` — election overview, party totals, and area search
- `/area/:id` — results for one province or territory
- `/compare?a=:id&b=:id` — shareable comparison of two distinct areas
- `/methodology` — source details, field notes, and formulas

## Calculations and data rules

- Total valid votes are summed from the rows loaded for the selected area(s).
- Party vote share is `party votes ÷ total valid votes × 100`; display precision is one decimal.
- No turnout is calculated without a positive eligible-voter denominator.
- Equal vote counts are displayed as equal counts and sorted alphabetically by official party label; no ranking or winner is inferred.
- Zero is displayed as `0`; an absent optional value is displayed as “Not provided.”
- The accessible data table provides the same party counts and percentages as the visual bars.

## Checks and production build

```sh
npm test
npm run build
```

The production `dist/` output can be deployed to any static host with a free tier. Direct routes should be configured to fall back to `index.html`. Before publishing, check the keyboard flow and the layout at 360 px, then spot-check displayed figures against the linked official source.
