# Data sources & record model

**Source of truth** is this directory. The web index under docs/data is generated.

- global-2026-2027.json: 75 imported, richly annotated worldwide records in the original Chinese schema.
- china-university-programs.json: 53 additional Chinese university / institute / science-camp / admissions tracks.

**Important:** The records are not all distinct independent internships. A parent program may contain multiple university campus tracks. Historic year records do not indicate live intake.

Every new record needs a stable ID, official HTTPS source, year, date checked, realistic eligibility and an explicit research type. Unknown values must be retained rather than guessed. Read ../CONTRIBUTING.md.

## Tier enumeration

lab / mentor / structured / exposure / community / admissions / course / commercial / unknown.

## Cost and mainland eligibility

Build script normalizes cost into free / aid / paid / unknown and mainland applicant eligibility into yes / conditional / no / unknown. Categories are a **search aid**, not a legal eligibility determination.

## Deploy data

Run:

    node scripts/build.mjs --check
    node scripts/build.mjs

Do not hand-edit generated docs/data/catalog.json; GitHub Actions regenerates it on deploy.

## Archiving and updates

For each new annual cycle, verify terms directly from the organizer and preserve which edition was actually confirmed. Source publication year, program edition, application deadline, and last-reviewed date are not interchangeable.
