# Prompt Templates

## Asset Generation Template
```text
Generate production-ready game assets from this contract.
Constraints:
1) Use exact canonical filename: <assetCode>.png
2) Use exact dimensions: <targetWidth>x<targetHeight>
3) Preserve role and style from candidate seed when provided.
4) For required variants, output all listed variants.
5) Keep transparent background where appropriate.
6) Prioritize readability for game-critical state visuals.
```

## Frontend Generation Template
```text
Generate a React + Vite + TypeScript frontend using this screen and asset contract.
Constraints:
1) Preserve all existing control IDs and semantic sections for backend wiring.
2) Use canonical asset filenames and exact target sizes.
3) Implement desktop and mobile behavior.
4) Include reconnect/error/resilience states.
5) Provide component tree, file tree, and integration adapter stubs.
```
