#!/usr/bin/env python3
"""
Generate a long-range business plan scaffold in Markdown.
"""

import argparse
from pathlib import Path


def make_year_headers(horizon_years: int) -> str:
    return " | ".join(f"Y{year}" for year in range(1, horizon_years + 1))


def make_placeholder_row(label: str, horizon_years: int) -> str:
    cells = " | ".join("-" for _ in range(horizon_years))
    return f"| {label} | {cells} |"


def build_markdown(business_name: str, horizon_years: int, currency: str) -> str:
    year_headers = make_year_headers(horizon_years)
    separator = " | ".join("---" for _ in range(horizon_years + 1))

    return f"""# {business_name} Long-Range Business Plan ({horizon_years} Years)

## Planning Frame

- Horizon: {horizon_years} years
- Currency: {currency}
- Version: Draft v0

## 1. Executive Summary

- Strategic ambition:
- Core customer:
- Primary offer:
- Growth thesis:

## 2. Strategic Thesis and Positioning

- Problem worth solving:
- Unique advantage:
- Why now:
- Win conditions:

## 3. Market and Customer Model

- Target segments:
- TAM:
- SAM:
- SOM:
- Customer evidence:

## 4. Business Model Design

- Revenue streams:
- Pricing approach:
- Gross margin logic:
- Recurring vs one-time split:

## 5. Growth Model

- Channel strategy:
- Acquisition loop:
- Retention and expansion loop:
- Channel risks:

## 6. Operating Model and Capabilities

- Team and roles:
- Systems and tooling:
- Key partnerships:
- Capability gaps:

## 7. Financial Scenarios

### 7.1 Base Case

| Metric | {year_headers} |
| {separator} |
{make_placeholder_row("Revenue", horizon_years)}
{make_placeholder_row("Gross Margin %", horizon_years)}
{make_placeholder_row("Operating Expense", horizon_years)}
{make_placeholder_row("Cash Burn / Generation", horizon_years)}

### 7.2 Upside Case

| Metric | {year_headers} |
| {separator} |
{make_placeholder_row("Revenue", horizon_years)}
{make_placeholder_row("Gross Margin %", horizon_years)}
{make_placeholder_row("Operating Expense", horizon_years)}
{make_placeholder_row("Cash Burn / Generation", horizon_years)}

### 7.3 Downside Case

| Metric | {year_headers} |
| {separator} |
{make_placeholder_row("Revenue", horizon_years)}
{make_placeholder_row("Gross Margin %", horizon_years)}
{make_placeholder_row("Operating Expense", horizon_years)}
{make_placeholder_row("Cash Burn / Generation", horizon_years)}

## 8. Risk Register

| Risk | Probability | Impact | Mitigation | Trigger |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## 9. KPI Tree

- North-star KPI:
- Input KPIs:
- Process KPIs:
- Lagging KPIs:

## 10. 90-Day Action Plan

| Priority | Action | Owner | Start | End | Success Metric |
| --- | --- | --- | --- | --- | --- |
| P0 |  |  |  |  |  |

## 11. Specialist Skill Backlog

| Skill Gap | Priority | Why It Matters | Status |
| --- | --- | --- | --- |
|  | P0/P1/P2 |  | Proposed |
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a Markdown scaffold for a long-range business plan.",
    )
    parser.add_argument(
        "--business-name",
        required=True,
        help="Business or project name shown in the document title.",
    )
    parser.add_argument(
        "--horizon-years",
        type=int,
        default=5,
        help="Planning horizon in years (3-10 recommended).",
    )
    parser.add_argument(
        "--currency",
        default="USD",
        help="Reporting currency label (default: USD).",
    )
    parser.add_argument(
        "--output",
        help="Output markdown file path. Prints to stdout if omitted.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.horizon_years < 3 or args.horizon_years > 10:
        raise SystemExit("--horizon-years must be between 3 and 10.")

    markdown = build_markdown(
        business_name=args.business_name.strip(),
        horizon_years=args.horizon_years,
        currency=args.currency.strip().upper(),
    )

    if args.output:
        output_path = Path(args.output).expanduser().resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(markdown)
        print(f"Wrote scaffold to {output_path}")
    else:
        print(markdown)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
