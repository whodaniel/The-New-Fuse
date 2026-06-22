---
name: sspdf
description:
  Generate PDF documents with the sspdf engine. Use when asked to create,
  render, or generate a PDF, invoice, report, article, tear sheet, event
  program, certificate, newspaper, or any printable document. Declarative
  JSON-in, PDF-out engine with automatic layout, page breaks, and theme system.
  By Hugo Palma (https://hugopalma.work/).
---

# Skill: sspdf Document Generator

Generate PDF documents using the sspdf engine. Build the source JSON, pick or
generate the right theme, and render the output. One invoke, one PDF.

## Step 0: Verify installation

```bash
npx h17-sspdf --help
```

If this fails, install it:

```bash
npm install h17-sspdf
```

## Context

The sspdf engine takes two inputs: a theme (styling) and a source (content as
JSON). The source contains only content and structural intent, no colors, no
sizes, no positions. The theme controls every visual decision via labels. The
core does the math.

Resolve the package location:

```bash
SSPDF_DIR=$(node -e "console.log(require('path').dirname(require.resolve('h17-sspdf')))")
```

## Required reading

Before generating any document, always read:

```bash
cat $SSPDF_DIR/DOCUMENTATION.md
```

Check available themes and source examples:

```bash
ls $SSPDF_DIR/examples/themes/
ls $SSPDF_DIR/examples/sources/
```

## Operation types

- `text` — wrapped text paragraphs (supports string arrays for multiple
  paragraphs)
- `row` — two values on one line, left-aligned and right-aligned
- `bullet` — marker character or vector shape + wrapped text (supports arrays)
- `divider` — horizontal line
- `spacer` — vertical space
- `pageBreak` — forces a new page
- `hiddenText` — invisible text for ATS keyword injection
- `quote` — blockquote with optional attribution
- `block` — groups children, optional container background/border,
  `keepTogether`
- `section` — groups children, allows page breaks inside
- `table` — data table with header, per-column alignment, alternating rows
- `chart` — bar, line, doughnut, pie via Chart.js (requires `canvas` npm
  package)
- `image` — embedded PNG/JPEG with optional centered caption
- `columns` — two-column side-by-side layout

Read DOCUMENTATION.md for field details on each type.

## Built-in fonts (20 Google Fonts)

**Sans-serif:** Inter, Roboto, Open Sans, Montserrat, Lato, Raleway, Nunito,
Work Sans, IBM Plex Sans, PT Sans, Oswald

**Serif:** Merriweather, Lora, Playfair Display, Crimson Text, Libre
Baskerville, Source Serif 4

**Monospace:** Fira Code, JetBrains Mono, Source Code Pro

Require path: `h17-sspdf/fonts/<name>.js`. Each exports `{ Regular, Bold }`.

```js
const INTER = require('h17-sspdf/fonts/inter.js');
customFonts: [
  {
    family: 'Inter',
    faces: [
      { style: 'normal', fileName: 'Inter-Regular.ttf', data: INTER.Regular },
      { style: 'bold', fileName: 'Inter-Bold.ttf', data: INTER.Bold },
    ],
  },
];
```

## Vector shapes as bullet markers

20 built-in vector shapes bypass text encoding. Set `shape` on the marker label:

```js
"doc.marker.arrow": { shape: "arrow", shapeColor: [0, 128, 255], shapeSize: 0.8, textIndentMm: 2 }
```

Available: `arrow`, `circle`, `square`, `diamond`, `triangle`, `dash`,
`chevron`, `doubleColon`, `commentSlash`, `hashComment`, `bracketChevron`,
`treeBranch`, `terminalPrompt`, `checkmark`, `cross`, `star`, `plus`, `minus`,
`warning`, `infoCircle`.

## Source JSON structure

```json
{
  "pageTemplates": {
    "footer": [{ "type": "divider", "label": "footer.rule" }],
    "footerHeightMm": 10
  },
  "operations": [
    { "type": "text", "label": "doc.title", "text": "Document Title" },
    { "type": "divider", "label": "doc.rule" },
    {
      "type": "text",
      "label": "doc.body",
      "text": ["Paragraph one.", "Paragraph two."]
    }
  ]
}
```

`{{page}}` token in text resolves to current page number.

## Rules

1. Every `label` in the source must exist in the theme.
2. The source never says how to render. No colors, no sizes, no font names in
   the JSON. Only content and label references.
3. Use `keepWithNext` on headings to prevent orphaning. Use `block` with
   `keepTogether` for grouped content.
4. Prefer text arrays over repeating the same operation for multiple paragraphs.
5. Table `rows` must match `columns` length.
6. Colors are always `[R, G, B]` arrays, 0-255.
7. Custom page sizes via `pageWidthMm`/`pageHeightMm` (e.g. 338x190mm for 16:9
   presentations). Default is A4.

## Workflow

1. Read `DOCUMENTATION.md` for the full operation reference.
2. Determine what document the user needs.
3. Check `examples/themes/` for an existing theme. If none fits, generate one
   (see sspdf-theme-generator skill).
4. Build the source JSON with correct operations and labels.
5. Render the PDF.

## Rendering

### CLI (simplest)

```bash
npx h17-sspdf -s my-source.json -t default -o output/my-doc.pdf
```

Built-in themes: `default`, `editorial`, `newsprint`, `corporate`, `ceremony`,
`program`, `financial`, `presentation`.

Custom theme file:

```bash
npx h17-sspdf -s my-source.json -t ./my-custom-theme.js -o output/custom.pdf
```

### Programmatic

```js
const { renderDocument } = require('h17-sspdf');
const theme = require('h17-sspdf/examples/themes/theme-default');
const source = require('./my-source.json');
renderDocument({ source, theme, outputPath: 'output/my-doc.pdf' });
```

### With charts (async, programmatic only)

```js
const { renderDocument, registerPlugin, plugins } = require("h17-sspdf");
registerPlugin("chart", plugins.chart);
async function main() {
  const chartOp = { type: "chart", chartType: "bar", data: { ... }, widthMm: 160, heightMm: 90 };
  await plugins.chart.preRender(chartOp);
  renderDocument({ source: { operations: [chartOp] }, theme, outputPath: "output/chart.pdf" });
}
main();
```

Note: the CLI handles chart pre-rendering automatically. The programmatic API
requires manual pre-rendering.

## Verification

After rendering, confirm the PDF exists and open it:

```bash
ls -la output/my-doc.pdf
if [[ "$OSTYPE" == "darwin"* ]]; then open output/my-doc.pdf; elif [[ "$OSTYPE" == "linux"* ]]; then xdg-open output/my-doc.pdf; else start output/my-doc.pdf; fi
```
