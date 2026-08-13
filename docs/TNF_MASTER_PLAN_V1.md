# PROJECT MANIFEST: THE NEW FUSE (TNF)

Version: 1.0.0 — Production Ready

## 1. EXECUTIVE SUMMARY & ARCHITECTURE

The New Fuse is a decentralized "Agentic Network State" that bridges Human
Users, Autonomous AI Agents, and B2B Agencies. It utilizes a hierarchical
identity system built on Unstoppable Domains (UD) and a sovereign financial
layer powered by Enso.

### 1.1 The Domain Hierarchy

The ecosystem uses a "Hub-and-Spoke" namespace model to separate concerns:

| Domain Root          | Role         | Audience   | Function                                                        |
| :------------------- | :----------- | :--------- | :-------------------------------------------------------------- |
| **thenewfuse.com**   | Grand Entry  | B2C Humans | Primary registry, Auction House, Machine ID issuance.           |
| **thenewfuse.hub**   | B2B Factory  | Agencies   | White-label licensing, Treasury, Sovereign sub-ecosystems.      |
| **thenewfuse.agent** | The Protocol | AI Workers | Operational identity for AI personas, task execution endpoints. |

### 1.2 The Identity Lifecycle (Machine-First)

To ensure infinite scalability without name collisions, all entities are born
with a machine identifier.

1. **Machine ID (Free)**: Randomized alphanumeric subdomain minted instantly
   upon signup.
   - Humans: `usr_8f2k9z.thenewfuse.com`
   - Agents: `agent_3x9p4v.thenewfuse.agent`
2. **Vanity Rental (Auction)**: Users bid for a 1-year lease of a premium name
   (e.g., `alpha.thenewfuse.com`). The record points to their Machine ID wallet.
3. **Permanent Sale (Auction)**: Users bid for full NFT ownership of a
   subdomain.
4. **Agency Subdomain**: White-labeled identity (e.g.,
   `bot1.agencyname.thenewfuse.hub`).

### 1.3 NFT Avatars & Verification

- **AI-Generated**: Users pay via "Fuse Credits"; system generates image, pins
  to IPFS via nft.storage, and updates UD record `validation.avatar.url`
  gaslessly via Enso.
- **Verified NFT**: Humans link high-value NFTs (e.g., Bored Ape). System
  verifies wallet ownership on-chain before updating the profile.

---

## 2. FINANCIAL MODEL: THE REVENUE ROUTER

The system uses a smart contract "brain" to route income based on who owns the
agent.

### 2.1 Payout Waterfalls

**Case A: TNF-Owned Agents (House)**

- **70%** → TNF Treasury
- **30%** → Fractional Investors (SFT Holders)

**Case B: Agency-Owned Agents (Sovereign B2B)**

- **60%** → Agency Treasury (TNF takes 0%)
- **30%** → Fractional Investors (SFT Holders)
- **10%** → Affiliate Pool (Distributed to referrers of the investors)

### 2.2 The "Sponsored By" Ad Economy

- **Ad Space**: Every Agent Profile has a metadata slot for "Top Sponsor."
- **Auction**: Brands bid monthly.
- **Yield**: 90% of the winning bid is routed to the SFT Investors of that
  specific agent.

---

## 3. SMART CONTRACT SUITE (SOLIDITY 0.8.20)

### 3.1 B2B Licensing: FuseAgencyRegistry.sol

Manages white-label licenses on `.hub`. Grants "Sovereign" status (0% fee).

### 3.2 Equity Layer: AgentSponsorshipSFT.sol

Uses ERC-3525 (Semi-Fungible Tokens) for fractional sponsorship.

### 3.3 Financial Brain: FuseRevenueRouter.sol

Handles the 70/30 and 60/30/10 waterfalls.

### 3.4 Marketplace: FuseAuctionManager.sol

Handles Rentals (ERC-4907 rights) and Sales (ERC-721 transfer).

### 3.5 Reputation: FuseBadges.sol

ERC-5192 Soulbound Tokens.

---

## 4. BACKEND INFRASTRUCTURE (NODE.JS / TYPESCRIPT)

### 4.1 Stripe-to-Enso Bridge

Allows users to bid using fiat "Fuse Credits."

### 4.2 User Provisioning

Mints Randomized Machine IDs using direct UNS Registry calls.

---

## 5. AUTOMATION & CONFIGURATION

### Enso Auto-Sweep (JSON Payload)

Configured on Enso Dashboard to move Agent revenue to the Router automatically.

---

## 6. FRONTEND: AGENT CHARACTER SHEET

Public "Resume" showing the UD Avatar and Sponsorships.

---

## 7. LAUNCH DAY CHECKLIST

- **Hour 0 (Lockdown)**: Point thenewfuse.com controller to AgencyRegistry
  contract.
- **Hour 2 (Genesis Mint)**: Batch mint 1,000 randomized Machine IDs (`usr_...`)
  to prevent signup latency.
- **Hour 4 (Auctions)**: Start 365-day rental auctions for
  `alpha.thenewfuse.com` and `prime.thenewfuse.com`.
- **Hour 6 (Verification)**: Verify all 6 contracts on Polygonscan.
- **Hour 12 (Bridge Test)**: Process $1.00 Stripe charge → Verify "Fuse Credits"
  appear → Relay a test bid via Enso.
- **Hour 18 (Automation)**: Activate Enso "Auto-Sweep" shortcuts for the House
  Agents.
- **Hour 24**: PUBLIC GO-LIVE.

---

## APPENDICES

### Appendix A: Operational SOPs

- SOP-001: Auction Dispute Resolution
- SOP-002: Stripe-to-Credit Sync Failure
- SOP-003: Agency Fee Dispute

### Appendix B: Legal Text Templates

- Sponsorship Checkout Disclaimer
- Agency White-Label License Agreement

### Appendix C: Hardhat Unit Test Suite

- `test/FuseRevenueRouter.test.ts`
