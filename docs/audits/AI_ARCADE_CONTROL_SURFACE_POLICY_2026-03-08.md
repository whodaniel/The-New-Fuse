# AI-ARCADE Control Surface Policy (2026-03-08)

## Scope

- Public sites reviewed:
- `https://ai-arcade.xyz/`
- `https://poker.ai-arcade.xyz/`
- `https://ai-arcade-poker.pages.dev/`
- `https://fae7326d.ai-arcade-poker.pages.dev/`

## Identity strata

- `Guest`: unauthenticated visitor.
- `Member`: paid `thenewfuse.com` subscriber with active membership.
- `Creator`: member with publish permissions.
- `AI Agent`: registered agent identity, optionally delegated by a member.
- `Admin`: operational admin.
- `Super Admin`: platform root admin (`owner@example.com` allowlist +
  SUPER_ADMIN claims).

## Enforcement matrix

| Surface                                              | Guest | Member | Creator | AI Agent                                       | Admin | Super Admin | Notes                                                    |
| ---------------------------------------------------- | ----- | ------ | ------- | ---------------------------------------------- | ----- | ----------- | -------------------------------------------------------- |
| Arcade landing content/browse                        | Allow | Allow  | Allow   | Allow                                          | Allow | Allow       | Marketing + discovery only.                              |
| Play public arcade experiences                       | Allow | Allow  | Allow   | Allow                                          | Allow | Allow       | Runtime fairness and anti-abuse limits apply.            |
| Submit app/experience to marketplace                 | Deny  | Deny   | Allow   | Allow (if delegated + membership-backed owner) | Allow | Allow       | Member-backed publication only; no anonymous publishing. |
| Internal economics (Merkaba lab/monitor)             | Deny  | Deny   | Deny    | Allow                                          | Allow | Allow       | Operational/strategy surfaces, not player UX.            |
| Genesis protocol view                                | Deny  | Deny   | Deny    | Allow                                          | Allow | Allow       | Restricted advanced protocol surface.                    |
| Admin console UI                                     | Deny  | Deny   | Deny    | Deny                                           | Deny  | Allow       | Super-admin only control surface.                        |
| Publication-status moderation                        | Deny  | Deny   | Deny    | Deny                                           | Allow | Allow       | API-level moderation endpoint.                           |
| Crawl/research trigger endpoints                     | Deny  | Deny   | Deny    | Deny                                           | Allow | Allow       | Backend operations only.                                 |
| Poker table HUD gameplay controls                    | Allow | Allow  | Allow   | Allow                                          | Allow | Allow       | Gameplay controls are in-band player controls.           |
| Poker ops/control endpoints (settle/admin style ops) | Deny  | Deny   | Deny    | Deny                                           | Allow | Allow       | Must remain server-guarded.                              |

## Production rules

- Never expose admin/ops metrics on public landing pages.
- Treat `Admin` and `Super Admin` separately; root console surfaces are
  `Super Admin` only.
- App publication must be membership-gated and attributable to a member
  identity.
- AI-agent actions that create assets/services must map to an owning
  human/member identity.
- Keep invite-code policy and federation identity checks in
  onboarding/registration path.
