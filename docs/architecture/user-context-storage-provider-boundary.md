# User Context Storage Provider Boundary

TNF owns the semantic contract and profile resolution. Provider adapters own provider-specific IO.

```text
TNF semantic layer
  profile + logical collection + authority + sensitivity
        |
        v
shared resolver
        |
        +-- local adapter -> filesystem
        +-- Google Drive adapter -> Drive API/MCP
```

The semantic layer must not depend on a Gemini-, Claude-, Codex-, browser-, desktop-, or web-specific config location. Those surfaces may receive generated projections from TNF state.
