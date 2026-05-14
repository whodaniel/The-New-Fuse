# Governance Notes

## Why this skill exists

Hermes pre-update snapshots can consume multi-GB quickly. Blind deletion is risky
because rollback anchors and state continuity may be lost. This skill enforces a
state-verified prune policy.

## Canonical verification checks

1. `snapshot_count`
2. `stale_count`
3. `latest_valid_state_db_snapshot`
4. per-snapshot `state_db.health`
5. model/provider timeline continuity

## Recommended retention posture

1. Always keep the latest valid snapshot.
2. Keep epoch boundaries for each model/provider period.
3. Remove stale snapshots first.
4. Remove epoch intermediates only after dry-run review.

## Failure handling

If post-apply verification shows:

1. no valid `state.db` anchor,
2. unexpected model timeline gaps,
3. unexpected jump in stale classifications,

stop and restore from a remaining snapshot before any further prune actions.
