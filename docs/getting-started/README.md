# Getting Started

- [Overview](../GETTING_STARTED.md)
- [Quickstart](../../QUICK_START_GUIDE.md)
- [Installation](../guides/installation.md)

## Default: Local Sub-Director + core fleet

Fresh OSS installs endow the TNF CLI as the **Local Sub-Director** and bring up
the core federated fleet automatically during `install-tnf-cli.sh`,
`tnf onboard`, or `tnf boot`:

```bash
bash scripts/install-tnf-cli.sh --from-local
# verify
tnf fleet core-status
bash scripts/runtime/local-subdirector-service.sh status
```

Skip with `TNF_SKIP_CORE_FLEET=1`. Details: `docs/guides/installation.md` §
“Install TNF CLI + Local Sub-Director fleet”.
