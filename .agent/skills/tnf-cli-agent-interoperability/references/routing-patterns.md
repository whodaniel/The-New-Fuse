# Routing Patterns

## Pattern 1: Explicit Wrapper Command

Use when reference CLI flow is useful but TNF should remain primary.

- Example shape: `tnf <external-command> ...`
- Behavior: normalize flags, validate constraints, then pass through.

## Pattern 2: Alias Compatibility

Use when users expect familiar naming from another CLI.

- Example shape: `tnf providers` aliasing `tnf auth`.
- Keep alias documented and testable.

## Pattern 3: Context-Aware Fallback

Use when reference behavior is needed only for unsupported TNF surfaces.

- Resolve native TNF command first.
- If unsupported and contract allows, forward to external CLI.
- Emit clear logs for routing decisions.

## Pattern 4: Protected TNF Entrypoint

Use when parity pressure suggests replacing TNF default UX.

- Keep TNF-native no-arg/start path unless explicitly overridden by contract.
- Compatibility remains available through explicit commands/options.
