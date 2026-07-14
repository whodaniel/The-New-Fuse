---
name: sspdf-theme-generator
description:
  Generate sspdf theme files from brand specs (colors, fonts, document type).
  Use when asked to create a theme, style a document, or design a PDF layout for
  sspdf. Produces a complete theme.js file that controls every visual decision
  for the sspdf PDF engine. By Hugo Palma (https://hugopalma.work/).
---

# Skill: sspdf Theme Generator

Generate theme files for the sspdf PDF engine. A theme is a JS object that
controls every visual decision in a document. You know the full label property
schema and produce themes that work on first render.

## Step 0: Verify installation

```bash
npx h17-sspdf --help
```

If this fails, install it:

```bash
npm install h17-sspdf
```

## Context

The sspdf engine takes two inputs: a theme (styling) and a source (content). The
theme controls page geometry, baseline state, and label styles. The source
references labels by name. If a label is missing, the engine throws.

Resolve the package location:

```bash
SSPDF_DIR=$(node -e "console.log(require('path').dirname(require.resolve('h17-sspdf')))")
```

## Required reading

Before generating a theme, always read:

```bash
cat $SSPDF_DIR/DOCUMENTATION.md
```

Also check existing themes for patterns:

```bash
ls $SSPDF_DIR/examples/themes/
```

Read at least one existing theme to match the project's conventions.

## Theme structure

```js
module.exports = {
  name: 'Theme Name',
  page: {
    format: 'a4',
    orientation: 'portrait',
    unit: 'mm',
    pageWidthMm: 338, // custom width (overrides format)
    pageHeightMm: 190, // custom height (overrides format)
    compress: true,
    marginTopMm: 20,
    marginBottomMm: 20,
    marginLeftMm: 18,
    marginRightMm: 18,
    backgroundColor: [255, 255, 255],
    defaultText: {
      fontFamily: 'helvetica',
      fontStyle: 'normal',
      fontSize: 10,
      color: [0, 0, 0],
      lineHeight: 1.2,
    },
    defaultStroke: {
      color: [0, 0, 0],
      lineWidth: 0.2,
      lineCap: 'butt',
      lineJoin: 'miter',
    },
    defaultFillColor: [255, 255, 255],
  },
  layout: { chartAlign: 'center', bulletIndentMm: 4 },
  labels: {
    /* every label the source JSON will reference */
  },
};
```

## Built-in fonts (20 Google Fonts)

Each exports `{ Regular, Bold }`. No italic TTFs included.

**Sans-serif:** Inter (`inter`), Roboto (`roboto`), Open Sans (`open-sans`),
Montserrat (`montserrat`), Lato (`lato`), Raleway (`raleway`), Nunito
(`nunito`), Work Sans (`work-sans`), IBM Plex Sans (`ibm-plex-sans`), PT Sans
(`pt-sans`), Oswald (`oswald`)

**Serif:** Merriweather (`merriweather`), Lora (`lora`), Playfair Display
(`playfair-display`), Crimson Text (`crimson-text`), Libre Baskerville
(`libre-baskerville`), Source Serif 4 (`source-serif-4`)

**Monospace:** Fira Code (`fira-code`), JetBrains Mono (`jetbrains-mono`),
Source Code Pro (`source-code-pro`)

Require path: `h17-sspdf/fonts/<name>.js`

If you set `fontStyle: "italic"` without a matching TTF, jsPDF throws. Only
`"normal"` and `"bold"` are available for built-in fonts.

## Shape-based bullet markers

```js
"doc.marker.arrow": { shape: "arrow", shapeColor: [0, 128, 255], shapeSize: 0.8, textIndentMm: 2 }
```

Available shapes: `npx h17-sspdf --shapes`

## Rules

1. Every label is self-contained. No inheritance between labels. If a label
   needs `fontFamily`, write `fontFamily`.
2. Colors are always `[R, G, B]` arrays, 0-255.
3. Default format is `"a4"`. Custom dimensions via `pageWidthMm`/`pageHeightMm`.
4. The `page` section must include `defaultText`, `defaultStroke`, and
   `defaultFillColor`, all fully specified.
5. Label names are arbitrary strings. Use dot-namespace convention:
   `invoice.title`, `report.body`.
6. Built-in jsPDF font families: `helvetica`, `courier`, `times`. For better
   typography, use the 20 shipped Google Fonts.
7. Table labels need `cellPaddingMm`, border properties, and optionally
   `altRowColor`. Use the shared constants from `examples/themes/table.js`.
8. Do not hardcode positions or sizes in labels that belong in the source JSON.

## Page-template margins (CRITICAL)

Header and footer operations from `pageTemplates` do NOT inherit
`page.marginLeftMm`/`page.marginRightMm`. Set side margins on each header/footer
label that match the page margins:

```js
"doc.header.left": { ..., marginLeftMm: 22, marginBottomPx: 0 },
"doc.footer.left": { ..., marginLeftMm: 22 },
```

## Label property quick reference

**Text:** `fontFamily`, `fontStyle`, `fontSize`, `color`, `lineHeight`,
`lineHeightMm`, `align`, `textTransform` **Spacing:** `marginTopMm`,
`marginTopPx`, `marginBottomMm`, `marginBottomPx` **Padding:** `paddingMm`,
`paddingPx`, `paddingTopMm`, `paddingBottomMm`, `paddingLeftMm`,
`paddingRightMm` **Container:** `backgroundColor`, `borderWidthMm`,
`borderColor`, `borderRadiusMm` **Left border accent:**
`leftBorder: { color, widthMm, gapMm, heightMm, topOffsetMm }` **Divider:**
`color`, `lineWidth`, `opacity`, `dashPattern` **Bullet marker (text):**
`fontFamily`, `fontStyle`, `fontSize`, `color`, `lineHeight`, `marker` **Bullet
marker (shape):** `shape`, `shapeColor`, `shapeSize`, `textIndentMm` **Table
cell:** `fontFamily`, `fontStyle`, `fontSize`, `color`, `lineHeight`,
`cellPaddingMm`, `backgroundColor`, `altRowColor`, `borderColor`, per-edge
border props **Image:** padding/margin props only (not font props) **Image
caption:** `fontFamily`, `fontSize`, `color`, `align: "center"`

## Workflow

1. Read `DOCUMENTATION.md` for the full property reference.
2. Read at least one existing theme in `examples/themes/` for conventions.
3. Ask the user what document type they need (or infer from context).
4. Identify every visual element the document will have. Each one needs a label.
5. Generate the theme file with all labels fully specified.
6. If the document uses tables, read `examples/themes/table.js` and use the
   shared constants pattern.
7. Write the file to the specified path.

## Validation checklist

- `page` section: format, orientation, all four margins,
  `defaultText`/`defaultStroke`/`defaultFillColor` fully specified
- Header/footer labels have side margins matching page margins
- Every label has `fontFamily` explicitly set
- Table labels have `cellPaddingMm`, `borderColor`, `altRowColor` if using
  alternating rows
- Divider labels have `color` and `lineWidth`
- Colors are `[R, G, B]` arrays, not hex strings
- `customFonts` array includes all fonts used in labels
