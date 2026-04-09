# Daniel Who Timeline Narrative Outline (Oldest Notes First)

- Scope: Apple Notes sequences 1..150 (oldest -> newer), extracted locally via
  Apple Notes automation.
- Generated: 2026-03-22T07:28:16.758Z
- Security handling: sensitive-looking content is redacted in batch extraction
  outputs.
- Extraction note: 4 notes timed out during read and were skipped
  (`seq 102, 121, 126, 127`).
- Source batches:
  - reports/personal-archaeology/findings/apple-notes-oldest-forward-start1-size50.json
  - reports/personal-archaeology/findings/apple-notes-oldest-forward-start51-size50.json
  - reports/personal-archaeology/findings/apple-notes-oldest-forward-start101-size50.json

## Suggested General Life Categories

- Identity
- Family
- Relationships
- Health & Wellness
- Education
- Career
- Business & Projects
- Finance
- Creativity
- Spirituality
- Travel
- Home
- Community
- Challenges
- Breakthroughs
- Legacy
- Personal

## Theme Distribution (Seq 1..150)

- Personal: 115
- Business & Projects: 15
- Health & Wellness: 7
- Creativity: 5
- Relationships: 3
- Travel: 2
- Family: 2
- Finance: 1

## Date Coverage Snapshot

- 2016: 1 notes
- 2017: 25 notes
- 2018: 18 notes
- 2019: 3 notes
- 2021: 79 notes
- 2022: 20 notes

## Sequential Timeline Segments (Draft)

### Segment 1: Notes 1-25

- Date window: 2016-06-23T16:32:45.000Z -> 2017-11-07T17:59:40.000Z
- Dominant themes: Personal (17), Health & Wellness (4), Creativity (2)
- Candidate category lane: Personal
- Sources:
  - Apple Notes seq range 1-25
  - Raw batch JSON/MD files listed above

### Segment 2: Notes 26-50

- Date window: 2017-11-07T18:07:12.000Z -> 2021-06-25T18:00:31.000Z
- Dominant themes: Personal (19), Business & Projects (3), Creativity (1)
- Candidate category lane: Personal
- Sources:
  - Apple Notes seq range 26-50
  - Raw batch JSON/MD files listed above

### Segment 3: Notes 51-75

- Date window: 2021-06-23T19:12:40.000Z -> 2021-08-25T17:45:59.000Z
- Dominant themes: Personal (17), Business & Projects (8)
- Candidate category lane: Personal
- Sources:
  - Apple Notes seq range 51-75
  - Raw batch JSON/MD files listed above

### Segment 4: Notes 76-100

- Date window: 2021-08-27T05:26:01.000Z -> 2021-10-06T20:50:05.000Z
- Dominant themes: Personal (21), Business & Projects (2), Health & Wellness (1)
- Candidate category lane: Personal
- Sources:
  - Apple Notes seq range 76-100
  - Raw batch JSON/MD files listed above

### Segment 5: Notes 101-125

- Date window: 2021-10-07T04:56:36.000Z -> 2021-12-04T22:23:22.000Z
- Dominant themes: Personal (25)
- Candidate category lane: Personal
- Sources:
  - Apple Notes seq range 101-125
  - Raw batch JSON/MD files listed above

### Segment 6: Notes 126-150

- Date window: Unknown -> 2022-05-12T14:36:56.000Z
- Dominant themes: Personal (16), Creativity (2), Relationships (2)
- Candidate category lane: Personal
- Sources:
  - Apple Notes seq range 126-150
  - Raw batch JSON/MD files listed above

## Next Sequential Pass

- Continue extraction with:
  `node scripts/timeline/extract-apple-notes-oldest-forward-batch.mjs --start-seq 151 --batch-size 50 --include-body`
- Repeat and append to this outline for full-notebook chronology.
