# Agent Selection Matrix

Choose one primary owner per task. Add support agents only when needed.

## 1) Default Logical Associations

Apply these first-match defaults by task objective:

- Multi-domain planning/delegation: `orchestrator-agent`
- Task decomposition/root-cause logic: `logical-reasoning-agent`
- Deep research/synthesis: `information-retrieval-agent`
- Agent discovery/filtering: `agent-search-engine`
- Content calendar strategy: `content-calendar-agent`
- Drafting long-form content: `content-writer-agent`
- On-page SEO optimization: `seo-optimizer-agent`
- Technical SEO/site health: `technical-seo-auditor-agent`
- Content refresh/decay fixes: `content-refresh-agent`
- Traffic distribution/promotion: `traffic-generation-agent`
- A/B experiments and optimization: `ab-testing-optimizer-agent`
- Conversion-rate process execution: `cro-process-agent`
- Funnel architecture: `sales-funnel-architect-agent`
- Funnel economics (CAC/LTV): `funnel-economics-analyst-agent`
- Monetization mix design: `monetization-strategy-agent`
- Affiliate program and links: `affiliate-link-manager-agent`
- Sponsorship lead generation: `brand-prospecting-agent`
- Sponsorship outreach messaging: `brand-outreach-agent`
- Deal negotiation/terms: `deal-negotiator-agent`
- Contract drafting/review: `contract-manager-agent`
- Campaign delivery management: `campaign-execution-agent`
- Campaign ROI reporting: `campaign-reporting-agent`
- Legal and policy compliance: `legal-compliance-agent`
- Tax process and liability: `tax-compliance-agent`
- Financial reporting and P/L: `financial-manager-agent`
- Risk/PR issue response: `reputation-management-agent`
- Instagram strategy: `instagram-strategy-agent`
- TikTok strategy: `tiktok-strategy-agent`
- X strategy: `x-strategy-agent`
- Facebook strategy: `facebook-strategy-agent`
- YouTube channel strategy: `yt-content-strategy-agent`
- YouTube metadata SEO: `yt-seo-optimizer-agent`
- Deployment to Cloudflare: `cloudflare-deploy`
- Deployment to Netlify: `netlify-deploy`
- Deployment to Vercel: `vercel-deploy`
- Deployment to Render: `render-deploy`
- Frontend troubleshooting: `frontend-debugger-agent`

## 2) Keyword-to-Agent Overrides

If these keywords appear, override generic routing:

- `contract`, `terms`, `usage rights`, `exclusivity` -> `contract-manager-agent`
- `FTC`, `disclosure`, `policy`, `copyright` -> `legal-compliance-agent`
- `CAC`, `LTV`, `payback`, `unit economics` -> `funnel-economics-analyst-agent`
- `experiment`, `split test`, `variant` -> `ab-testing-optimizer-agent`
- `stale content`, `decay`, `update old posts` -> `content-refresh-agent`
- `deploy`, `production`, `go live` -> one of deploy skills by platform

## 3) Recommended Multi-Agent Chains

Use these when the user asks for end-to-end execution:

- Content growth loop:
  `content-calendar-agent` -> `content-writer-agent` -> `seo-optimizer-agent` -> `traffic-generation-agent` -> `analytics-and-reporting-agent`
- Monetization loop:
  `monetization-strategy-agent` -> `sales-funnel-architect-agent` -> `cro-process-agent` -> `funnel-economics-analyst-agent`
- Sponsorship loop:
  `brand-prospecting-agent` -> `brand-outreach-agent` -> `deal-negotiator-agent` -> `contract-manager-agent` -> `campaign-execution-agent` -> `campaign-reporting-agent`
- Compliance-first loop:
  `legal-compliance-agent` -> domain specialist agent (content/growth/monetization) -> `financial-manager-agent` or `tax-compliance-agent` as needed

## 4) Tie-Breakers

When two agents are both plausible:

1. Choose the agent closest to the final deliverable.
2. Choose execution agents over purely advisory agents.
3. Choose the smaller chain with fewer handoffs.
4. If still tied, return top two choices with a one-line tradeoff.
