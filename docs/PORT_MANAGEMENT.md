# Port Management

TNF port management is active through the root CLI:

```bash
./tnf ports status
./tnf ports conflicts
./tnf ports preflight
./tnf ports clear --port 3000 --yes
```

The standalone wrapper is also available for scripts:

```bash
./tnf-ports status
```

## Safety Model

- `status`, `conflicts`, and `preflight` are non-destructive.
- `preflight` is warning-only by default.
- `preflight --strict` exits non-zero when required non-protected ports are occupied.
- `conflicts --auto-resolve` and `clear --yes` are opt-in destructive actions.
- Protected ports such as Redis, Postgres, Drizzle Studio, and the protected Skideancer socket are never terminated unless `--include-protected` is also passed.

## Local Profile

Port policy can be configured in exported shell env, `.env`, `.env.local`, or `.tnf.local.env`.

Precedence:

```text
exported shell env > .tnf.local.env > .env.local > .env > built-in defaults
```

Useful variables:

```bash
# Add project-specific ports to the catalog.
TNF_PORTS=8080:custom-api,9000:custom-ws

# Allow intentional listeners during preflight.
TNF_PORTS_ALLOW_OCCUPIED=3005,6379

# Make factory boot fail when required ports are occupied.
FACTORY_BOOT_PORT_PREFLIGHT_STRICT=true
```

See `docs/reference/local-runtime-profile.md` for the broader local-assets policy.

## Default Catalog

| Port | Service | Protected |
| ---: | --- | --- |
| 3000 | frontend | no |
| 3001 | api/backend | no |
| 3004 | backend | no |
| 3005 | api-gateway/ws-bridge | no |
| 3006 | skideancer/ws | no |
| 3007 | skideancer/ide | no |
| 3008 | skideancer websocket | yes |
| 5173 | vite | no |
| 5174 | vite-alt | no |
| 5555 | drizzle-studio | yes |
| 6379 | redis | yes |
| 5432 | postgres | yes |

## Boot Integration

`./tnf boot --plan` lists port preflight as an early boot step.

During real boot, TNF runs:

```bash
node scripts/tnf-ports.cjs preflight
```

When `--strict-gates` is used, TNF runs strict preflight and blocks boot on occupied required ports.

## Troubleshooting

Inspect listeners:

```bash
./tnf ports status
```

Check whether boot would be blocked in strict mode:

```bash
./tnf ports preflight --strict
```

Allow an intentional local listener:

```bash
printf "TNF_PORTS_ALLOW_OCCUPIED=3005\n" >> .tnf.local.env
./tnf ports preflight --strict
```

Clear one non-protected port:

```bash
./tnf ports clear --port 3000 --yes
```

Do not use ad hoc `kill` commands until `./tnf ports status` has identified the owning process.
