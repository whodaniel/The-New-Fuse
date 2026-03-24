#!/usr/bin/env python3
"""Validate ValueLadderReport JSON contract."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any, Dict, List

EXPECTED_FUNNELS = {
    "front_end": "LeadMagnetFunnel",
    "front_end_monetization": "TripwireFunnel",
    "mid_tier": "WebinarFunnel",
    "back_end": "HighTicketFunnel",
    "retention_and_ltv_extension": "ContinuityRetentionLoop",
}


def _die(msg: str) -> None:
    print(f"Invalid: {msg}", file=sys.stderr)
    raise SystemExit(1)


def _require(condition: bool, msg: str) -> None:
    if not condition:
        _die(msg)


def _is_non_empty_str(v: Any) -> bool:
    return isinstance(v, str) and bool(v.strip())


def _validate_ladder_order(rungs: List[Dict[str, Any]]) -> None:
    _require(isinstance(rungs, list) and len(rungs) > 0, "value_ladder_rungs missing/empty")
    expected = list(range(1, len(rungs) + 1))
    actual = [r.get("rung") for r in rungs]
    _require(actual == expected, "rung order must be strictly increasing from 1..N")


def _validate_funnels(mapping: Dict[str, Any]) -> None:
    for key, funnel_type in EXPECTED_FUNNELS.items():
        _require(key in mapping, f"funnel_mapping.{key} missing")
        section = mapping[key]
        _require(isinstance(section, dict), f"funnel_mapping.{key} must be object")
        _require(
            section.get("funnel_type") == funnel_type,
            f"funnel_mapping.{key}.funnel_type must be {funnel_type}",
        )
        _require(
            isinstance(section.get("steps"), list) and len(section["steps"]) >= 3,
            f"funnel_mapping.{key}.steps must have at least 3 items",
        )
        _require(
            isinstance(section.get("kpi_focus"), list) and len(section["kpi_focus"]) >= 3,
            f"funnel_mapping.{key}.kpi_focus must have at least 3 items",
        )


def validate_report(payload: Dict[str, Any]) -> None:
    _require(isinstance(payload, dict), "root must be object")
    _require("value_ladder_report" in payload, "root.value_ladder_report missing")
    report = payload["value_ladder_report"]
    _require(isinstance(report, dict), "value_ladder_report must be object")

    assumptions = report.get("assumptions")
    _require(isinstance(assumptions, list), "assumptions must be array")

    catalog = report.get("product_and_service_catalog")
    _require(isinstance(catalog, list) and len(catalog) > 0, "product_and_service_catalog missing/empty")

    rungs = report.get("value_ladder_rungs")
    _validate_ladder_order(rungs)

    funnel_mapping = report.get("funnel_mapping")
    _require(isinstance(funnel_mapping, dict), "funnel_mapping must be object")
    _validate_funnels(funnel_mapping)

    mermaid = report.get("ecosystem_flowchart_mermaid")
    _require(_is_non_empty_str(mermaid), "ecosystem_flowchart_mermaid must be non-empty string")
    _require(str(mermaid).strip().startswith("graph TD"), "ecosystem_flowchart_mermaid must start with 'graph TD'")

    narrative = report.get("strategic_narrative")
    _require(_is_non_empty_str(narrative), "strategic_narrative must be non-empty string")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", help="Path to ValueLadderReport JSON")
    args = parser.parse_args()

    report_path = Path(args.report)
    if not report_path.exists():
        _die(f"Report not found: {report_path}")

    try:
        payload = json.loads(report_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        _die(f"Report is not valid JSON: {exc}")

    validate_report(payload)
    print("valid")


if __name__ == "__main__":
    main()
