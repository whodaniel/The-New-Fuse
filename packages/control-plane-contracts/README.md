# @the-new-fuse/control-plane-contracts

Public TypeScript contracts for TNF proprietary control-plane components.

|                |                                              |
| -------------- | -------------------------------------------- |
| **npm name**   | `@the-new-fuse/control-plane-contracts`      |
| **path**       | `packages/control-plane-contracts`           |
| **visibility** | Always public (ships in `The-New-Fuse`) |

## Exports

- `MasterClockConfig`, `MasterClockSignal`
- `BrokerConfig`, `BrokerPolicyDecision`, `BrokerPolicyResult`

Full Master Clock / Broker Agent **implementations** are proprietary
(`packages/relay-core/src/master-clock.ts`, `broker-agent.ts`) and sync to
[`fuse-control-plane`](https://github.com/whodaniel/The-New-Fuse-control-plane).
Open-runtime stubs re-export these contracts only — see `scripts/sync-repos.sh`.

```bash
pnpm --filter @the-new-fuse/control-plane-contracts build
```

See [`docs/REPO_SEPARATION.md`](../../docs/REPO_SEPARATION.md).
