# Pipeline Checklist

## 1) Discovery
- Locate manifest CSV, UI structure file, CSS hooks, and local image pools.
- Count required assets and required dimension buckets.

## 2) Mapping
- Map each required `assetCode` to best candidate path (if any).
- Record candidate dimensions.
- Assign fit label.

## 3) Coverage
- Report totals:
  - total required
  - with candidate
  - no candidate
  - exact-size matches

## 4) Screen Context
- Tie each asset group to screen-relative location.
- Tie assets to known CSS/DOM hooks where available.

## 5) Browser Deliverable
- Generate copy-ready per-asset cards.
- Include thumbnails and absolute local paths.
- Include one-shot prompt containers for AI Studio.

## 6) Prompt Pack
- Asset-generation prompt with exact filename/dimension contract.
- Frontend-generation prompt with section and wiring constraints.

## 7) Validation
- Ensure no required assets are skipped.
- Ensure target dimensions are never inferred; only read from manifest.
