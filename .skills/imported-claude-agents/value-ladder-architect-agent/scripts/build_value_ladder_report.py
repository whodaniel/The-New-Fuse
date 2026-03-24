#!/usr/bin/env python3
"""Build a deterministic ValueLadderReport JSON from ValueLadderInput."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any, Dict, List

ALLOWED_TYPES = {
    "lead_magnet",
    "tripwire",
    "core_offer",
    "high_ticket",
    "continuity",
    "unknown",
}

RANK_BY_TYPE = {
    "lead_magnet": 0,
    "tripwire": 1,
    "core_offer": 2,
    "continuity": 3,
    "high_ticket": 4,
    "unknown": 5,
}

DEFAULT_OFFERS = [
    {
        "name": "Free Growth Playbook",
        "type": "lead_magnet",
        "price_usd": 0,
        "description": "Quick-win framework that captures qualified leads.",
    },
    {
        "name": "Starter Toolkit",
        "type": "tripwire",
        "price_usd": 27,
        "description": "Templates and checklists for fast execution.",
    },
    {
        "name": "Core Accelerator Program",
        "type": "core_offer",
        "price_usd": 997,
        "description": "Structured implementation system with guidance.",
    },
    {
        "name": "Insider Membership",
        "type": "continuity",
        "price_usd": 97,
        "description": "Monthly support and retention layer.",
    },
    {
        "name": "Elite Advisory",
        "type": "high_ticket",
        "price_usd": 12000,
        "description": "High-touch strategic scaling support.",
    },
]


def _die(message: str, code: int = 1) -> None:
    print(f"Error: {message}", file=sys.stderr)
    raise SystemExit(code)


def _safe_type(raw: Any) -> str:
    value = str(raw or "unknown").strip().lower()
    return value if value in ALLOWED_TYPES else "unknown"


def _to_price(value: Any) -> int:
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return 0


def _normalize_catalog(raw_catalog: Any) -> List[Dict[str, Any]]:
    if not isinstance(raw_catalog, list) or not raw_catalog:
        return [dict(item) for item in DEFAULT_OFFERS]

    normalized: List[Dict[str, Any]] = []
    for item in raw_catalog:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        normalized.append(
            {
                "name": name,
                "type": _safe_type(item.get("type")),
                "price_usd": _to_price(item.get("price_usd", 0)),
                "description": str(item.get("description") or "").strip()
                or "No description provided.",
            }
        )

    if not normalized:
        return [dict(item) for item in DEFAULT_OFFERS]
    return normalized


def _sorted_ladder(catalog: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(
        catalog,
        key=lambda x: (RANK_BY_TYPE.get(x["type"], 99), x["price_usd"], x["name"]),
    )


def _offer_by_type(catalog: List[Dict[str, Any]], offer_type: str) -> str:
    for item in catalog:
        if item["type"] == offer_type:
            return item["name"]
    return "Not specified"


def _build_rungs(catalog: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    goals = {
        "lead_magnet": "Get a quick win and build trust.",
        "tripwire": "Make a low-risk first purchase.",
        "core_offer": "Achieve core transformation.",
        "continuity": "Sustain progress and increase retention.",
        "high_ticket": "Scale with high-touch support.",
        "unknown": "Advance to the next best-fit offer.",
    }
    rungs: List[Dict[str, Any]] = []
    for idx, item in enumerate(_sorted_ladder(catalog), start=1):
        rungs.append(
            {
                "rung": idx,
                "offer": item["name"],
                "type": item["type"],
                "price_usd": item["price_usd"],
                "customer_goal": goals[item["type"]],
            }
        )
    return rungs


def _build_funnel_mapping(catalog: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "front_end": {
            "funnel_type": "LeadMagnetFunnel",
            "offer": _offer_by_type(catalog, "lead_magnet"),
            "steps": [
                "Traffic source",
                "Opt-in page",
                "Lead capture",
                "Welcome sequence",
            ],
            "kpi_focus": ["Opt-in rate", "Cost per lead", "Email click-through rate"],
        },
        "front_end_monetization": {
            "funnel_type": "TripwireFunnel",
            "offer": _offer_by_type(catalog, "tripwire"),
            "steps": [
                "Thank-you page OTO",
                "Checkout",
                "Post-purchase onboarding",
                "Segmentation trigger",
            ],
            "kpi_focus": ["Tripwire take rate", "AOV", "Refund rate"],
        },
        "mid_tier": {
            "funnel_type": "WebinarFunnel",
            "offer": _offer_by_type(catalog, "core_offer"),
            "steps": [
                "Registration page",
                "Reminder sequence",
                "Webinar event",
                "Offer close sequence",
            ],
            "kpi_focus": ["Show-up rate", "Webinar conversion rate", "Sales conversion"],
        },
        "back_end": {
            "funnel_type": "HighTicketFunnel",
            "offer": _offer_by_type(catalog, "high_ticket"),
            "steps": [
                "Ascension invite",
                "Application",
                "Qualification call",
                "Enrollment",
            ],
            "kpi_focus": ["Application rate", "Call show rate", "Close rate"],
        },
        "retention_and_ltv_extension": {
            "funnel_type": "ContinuityRetentionLoop",
            "offer": _offer_by_type(catalog, "continuity"),
            "steps": [
                "Continuity upsell",
                "Monthly value delivery",
                "Engagement loops",
                "Referral trigger",
            ],
            "kpi_focus": ["Monthly churn", "Net revenue retention", "Referral rate"],
        },
    }


def _build_mermaid(catalog: List[Dict[str, Any]]) -> str:
    lead = _offer_by_type(catalog, "lead_magnet")
    trip = _offer_by_type(catalog, "tripwire")
    core = _offer_by_type(catalog, "core_offer")
    high = _offer_by_type(catalog, "high_ticket")
    cont = _offer_by_type(catalog, "continuity")
    return (
        "graph TD\n"
        "A[Cold Traffic] --> B[Lead Magnet Opt-in]\n"
        f"B --> C[{lead}]\n"
        f"C --> D[Tripwire OTO: {trip}]\n"
        "D --> E[Email Nurture + Segmentation]\n"
        "E --> F[Webinar Registration]\n"
        "F --> G[Webinar Event]\n"
        f"G --> H[Core Offer: {core}]\n"
        "H --> I[Onboarding + Milestones]\n"
        "I --> J[Ascension Invite]\n"
        "J --> K[High-Ticket Application]\n"
        "K --> L[Qualification Call]\n"
        f"L --> M[{high}]\n"
        f"H --> N[{cont}]\n"
        "N --> O[Retention + Community]\n"
        "M --> O\n"
        "O --> P[Referral Loop]\n"
        "P --> A"
    )


def _build_report(catalog: List[Dict[str, Any]], inferred: bool) -> Dict[str, Any]:
    assumptions = []
    if inferred:
        assumptions.append(
            "Catalog was missing or invalid; a standard offer ladder was inferred."
        )
    assumptions.extend(
        [
            "Goal is maximizing LTV through ascension and retention.",
            "Traffic assumed from organic channels, email, and retargeting.",
        ]
    )

    return {
        "value_ladder_report": {
            "assumptions": assumptions,
            "product_and_service_catalog": catalog,
            "value_ladder_rungs": _build_rungs(catalog),
            "funnel_mapping": _build_funnel_mapping(catalog),
            "ecosystem_flowchart_mermaid": _build_mermaid(catalog),
            "strategic_narrative": (
                "This ecosystem acquires leads with a free quick-win asset, validates buyer "
                "intent with a low-ticket tripwire, and converts qualified prospects into the "
                "core offer through a webinar sequence. Customers with demonstrated progress "
                "ascend into a high-ticket application funnel, while continuity extends value "
                "delivery, improves retention, and increases lifetime value."
            ),
        }
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Path to ValueLadderInput JSON")
    parser.add_argument("--out", help="Path for report JSON output (default: stdout)")
    parser.add_argument(
        "--pretty", action="store_true", help="Pretty-print output JSON with indentation"
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        _die(f"Input file not found: {input_path}")

    try:
        payload = json.loads(input_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        _die(f"Input is not valid JSON: {exc}")

    raw_catalog = payload.get("product_and_service_catalog")
    inferred = not isinstance(raw_catalog, list) or not raw_catalog
    catalog = _sorted_ladder(_normalize_catalog(raw_catalog))
    report = _build_report(catalog, inferred)

    output = json.dumps(report, indent=2 if args.pretty else None)
    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output + "\n", encoding="utf-8")
        print(str(out_path))
    else:
        print(output)


if __name__ == "__main__":
    main()
