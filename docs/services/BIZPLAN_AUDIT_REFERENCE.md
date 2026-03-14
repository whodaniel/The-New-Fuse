# Bizplan Technical Reference & Feature Audit

This document contains detailed notes and UI analysis of the **Bizplan.com**
platform, captured for integration and reverse-engineering into **The New Fuse
(TNF)**.

---

## 1. Core Ecosystem Components

Bizplan is not just a document builder; it's a suite of integrated startup
tools:

- **Bizplan Builder**: Guided business plan creation.
- **Financial Engine**: Personnel, Revenue, and Expense forecasting.
- **Fundable**: Direct pathway to raising capital (integrated coupon/access).
- **Launchrock**: Landing page builder for customer validation.
- **Education**: On-demand courses for founders.

---

## 2. Bizplan Builder: Chapter Structure

The builder uses a structured approach with 17 mandatory/optional chapters:

1.  **Cover**: Visual identity and branding.
2.  **Summary**: Executive high-level overview.
3.  **The Big Problem**: Pain point identification.
4.  **The Unique Solution**: Value proposition.
5.  **Market**: Size, opportunity, and trends.
6.  **Customers**: Target audience profiles.
7.  **Competitors**: Competitive landscape mapping.
8.  **Traction**: Evidence of progress (revenue, users).
9.  **Risk**: Potential obstacles and mitigation.
10. **Team**: Leadership and advisory profiles.
11. **Strategy**: Strategic roadmap.
12. **Marketing**: Acquisition channels.
13. **Sales**: Revenue conversion logic.
14. **Milestones**: Key goals and dates.
15. **Financials**: Integrated financial reports.
16. **Funding**: The "Ask" and use of funds.
17. **Appendix**: Supporting documentation.

---

## 3. Financial Engine: Interaction Design

The financial engine is the platform's "Superpower." It uses a grid-based,
in-place editing system similar to the TNF Timeline.

### 3.1 Personnel Planning

- **Fields**: Position title, Employee name, Yearly Salary, Start Date,
  Benefits/Tax % (Global or per role).
- **Views**: Plan (Forecast), Details (Breakdown), Actuals (Real-world
  tracking).
- **Logic**: Automatically calculates "Team Spend," "% of Revenue," and "Revenue
  per Employee."

### 3.2 Revenue Forecasting

- **Structure**: Multi-stream support (e.g., Subscription, One-time, Service).
- **Metrics**: Projected Revenue, Projected Costs, Gross Profit, Net Income.
- **Interactions**: Monthly grid entry with automatic annual aggregation.

### 3.3 Capital & Metrics

- **Automated Ratios**: Current Ratio, Quick Ratio, Return on Equity, Debt to
  Equity.
- **Operational Inputs**: Inventory, Accounts Receivable, CapEx, Accounts
  Payable, Debt, Distributions.

---

## 4. Reporting Output

The platform generates four mission-critical reports:

1.  **Balance Sheet**: Standard monthly breakdown of Assets, Liabilities, and
    Equity.
2.  **Income Statement**: P&L with Gross and Net margins.
3.  **Cash Flow**: In-depth look at cash burn and runway.
4.  **Break Even**: Analysis of units/revenue needed to reach profitability.

---

## 5. UI/UX Reference Kit (Snapshots)

The following UI states have been captured for reference:

- [Add New Plan Layout](https://builder.bizplan.com/account/companies/add_new)
- [Plan Creator Dashboard](https://builder.bizplan.com/p/5870005428)
- [Financial Personnel Grid](https://builder.bizplan.com/f/5870005428#/personnel/plan/monthly/2026)
- [Revenue Forecasting UI](https://builder.bizplan.com/f/5870005428#/revenue/plan/monthly/2026)
- [Income Statement Report](.playwright-mcp/bizplan_income_statement.md)
- [Cash Flow Report](.playwright-mcp/bizplan_cash_flow.md)
- [Break Even Analysis](.playwright-mcp/bizplan_break_even.md)

---

## 6. Implementation Strategy for TNF

- **Data Model**: Extend `UnifiedLedger` to support `FinancialRecord` and
  `ChapterRecord` types.
- **UI Engine**: Reuse the `TimelineView` grid logic for financial forecasting.
- **Reporting**: Implement a PDF/Markdown generation service for investor-ready
  outputs.
