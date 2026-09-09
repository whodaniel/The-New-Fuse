# Marketplace Listing-Gate Design

> Status: DRAFT — awaiting operator decisions on three open questions (§5).
> Provenance: Authored 2026-09-04. This is **fresh design**, not recovery of a
> prior artifact. A repo-wide search (monorepo prose,
> `TNF-Extensions/ai-arcade`, archive dirs, and shelved contract source) found
> **no prior written listing-gate rules**; the operator's remembered rules
> existed as intent only. Search receipts in §6.

## 1. The three rules (operator intent, 2026-09-03)

1. **Purchase-first:** a customer must have completed at least one purchase
   before they may create a listing.
2. **NFT-hold to list own NFTs:** a seller must hold a TNF NFT to list NFTs of
   their own (self-issued agent NFTs).
3. **Commissions:** platform commissions apply to marketplace transactions.

## 2. Surviving primitives (verified in `packages/contracts-legacy/`)

| Rule              | Primitive                                                                                                                                                                                  | State                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| NFT-hold          | `FuseBadges` (ERC-721; v5-ready: `Ownable(msg.sender)` ctor + `_update` override; imports are version-neutral) — `awardBadge(to, badgeType)` owner-only; `balanceOf` inherited from ERC721 | Intact, **closest to v5-ready** of the shelved set                            |
| Commissions       | `RentalMarketplace.platformFeePercentage` (default 250 bps = 2.5%), `feeRecipient`, `updatePlatformFee`                                                                                    | Intact; arithmetic at line 284 `(totalPrice * platformFeePercentage) / 10000` |
| Commissions (alt) | `RoyaltySplitter` — multi-generational bps splits across agent lineage                                                                                                                     | Intact; complements platform fee for creator-side royalties                   |
| Purchase-first    | **none** — no purchase ledger exists in schema (`purchase`/`orders` pgTable: zero matches)                                                                                                 | **Must be designed**                                                          |

## 3. Relationship to ACCESS_CONTROL_MATRIX.md

The access-control matrix gates _platform feature access_ on paid tier
(PRO/ENTERPRISE) or super-admin. Listing gates gate _marketplace participation_
on ownership/purchase history. These are **different axes, not a
contradiction**:

- Tier gates → what UI/API surfaces an account can reach.
- Listing gates → who may transact in the marketplace once there.

Both apply; they compose.

## 4. Where the gates live (model)

Gates evaluate at **listing creation** in the unified catalog model
(`marketplaceCatalogItems` — `kind` column, varchar(40), indexed):

- `kind` values extend to include `agent_share` (the fractional order book
  becomes one item kind rather than the whole marketplace — action 19).
- Seller identity is a **did:tnf** value (`sellerDid`) per
  `TNF_AUTHORITY_IDENTIFIER_STANDARD.md` — never a bare agent name.
- Gate checks (pseudo):
  - `requirePurchaseFirst(sellerDid)` → consults purchase ledger (§5.1).
  - `requireTnfNftHold(sellerDid)` → `FuseBadges.balanceOf(seller) > 0`
    (candidate; §5.2 decides mechanism).
  - Commission applied at settlement via `platformFee` + optional
    `RoyaltySplitter` for lineage royalties (§5.3 sets rates).

## 5. Open decisions (operator)

1. **Purchase ledger authority:** DB orders table vs on-chain purchase events.
   On-chain gives trustless verification but needs an indexer (the existing
   chain-listener is arcade-scoped). DB is fast but platform-trusted.
2. **Hold-gate mechanism:** `FuseBadges.balanceOf` (reuse, badges as listing
   license) vs a distinct TNF-NFT ERC-721 hold check (stronger claim to "holds a
   TNF NFT" as written).
3. **Commission rates per item type:** flat platformFee across kinds vs per-kind
   rates (skill/workflow/image/music/agent-share).

## 6. Search provenance (why this is fresh design)

- Monorepo prose (`rg` full-tree, purchase-before-list / first-purchase /
  must-hold-NFT patterns): **0 relevant hits**.
- `TNF-Extensions/ai-arcade` repo: 3 markdown files, all game-economy; **0
  hits**.
- Shelved contracts source: `createListing` has **no gate**; no
  `hasPurchased`/`purchasedBefore` concept in any of the 11 files.
- Archives/monetization docs: only unrelated e-commerce-client-agent content.

## 7. Sequence

1. Operator decides §5 (three decisions).
2. Purchase ledger implemented (whichever §5.1 path).
3. Gates wired at `marketplaceCatalogItems` creation + on-chain listing entry.
4. Commission path: `RentalMarketplace` fee model referenced or extracted into
   the unified settlement flow.
