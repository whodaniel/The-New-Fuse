#!/usr/bin/env python3
"""Validate AlgorithmUpdateBrief JSON against schema with package/fallback modes."""

import argparse
import json
import re
import sys
from pathlib import Path

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
URL_RE = re.compile(r"^https://")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _expect_type(errors, value, typ, path):
    if not isinstance(value, typ):
        errors.append(f"{path}: expected {typ.__name__}, got {type(value).__name__}")
        return False
    return True


def _expect_keys(errors, obj, required, allowed, path):
    missing = sorted(set(required) - set(obj.keys()))
    extra = sorted(set(obj.keys()) - set(allowed))
    for k in missing:
        errors.append(f"{path}: missing required key '{k}'")
    for k in extra:
        errors.append(f"{path}: unexpected key '{k}'")


def validate_fallback(data):
    errors = []

    required_root = {
        "as_of",
        "input_assumptions",
        "limitation_statement",
        "challenge_objective",
        "algorithm_findings",
        "strategy_adjustments",
        "monitoring_plan",
    }
    if not _expect_type(errors, data, dict, "$"):
        return errors
    _expect_keys(errors, data, required_root, required_root, "$")

    if "as_of" in data:
        if _expect_type(errors, data["as_of"], str, "$.as_of") and not DATE_RE.match(data["as_of"]):
            errors.append("$.as_of: must match YYYY-MM-DD")

    if "input_assumptions" in data:
        ia = data["input_assumptions"]
        req = {"platforms", "current_content_strategy"}
        if _expect_type(errors, ia, dict, "$.input_assumptions"):
            _expect_keys(errors, ia, req, req, "$.input_assumptions")
            if "platforms" in ia and _expect_type(errors, ia["platforms"], list, "$.input_assumptions.platforms"):
                if not ia["platforms"]:
                    errors.append("$.input_assumptions.platforms: must not be empty")
                dup_check = set()
                for i, p in enumerate(ia["platforms"]):
                    if not _expect_type(errors, p, str, f"$.input_assumptions.platforms[{i}]"):
                        continue
                    if not p:
                        errors.append(f"$.input_assumptions.platforms[{i}]: must not be empty")
                    if p in dup_check:
                        errors.append(f"$.input_assumptions.platforms[{i}]: duplicate value '{p}'")
                    dup_check.add(p)
            if "current_content_strategy" in ia and _expect_type(
                errors, ia["current_content_strategy"], str, "$.input_assumptions.current_content_strategy"
            ):
                if not ia["current_content_strategy"]:
                    errors.append("$.input_assumptions.current_content_strategy: must not be empty")

    for key in ["limitation_statement", "challenge_objective"]:
        if key in data and _expect_type(errors, data[key], str, f"$.{key}") and not data[key]:
            errors.append(f"$.{key}: must not be empty")

    if "algorithm_findings" in data:
        af = data["algorithm_findings"]
        if _expect_type(errors, af, list, "$.algorithm_findings"):
            if not af:
                errors.append("$.algorithm_findings: must not be empty")
            required = {"platform", "date_of_change", "change_summary", "strategy_impact", "confidence", "sources"}
            for i, item in enumerate(af):
                path = f"$.algorithm_findings[{i}]"
                if not _expect_type(errors, item, dict, path):
                    continue
                _expect_keys(errors, item, required, required, path)
                for k in ["platform", "date_of_change", "change_summary", "strategy_impact"]:
                    if k in item and _expect_type(errors, item[k], str, f"{path}.{k}") and not item[k]:
                        errors.append(f"{path}.{k}: must not be empty")
                if "confidence" in item and _expect_type(errors, item["confidence"], str, f"{path}.confidence"):
                    if item["confidence"] not in {"low", "medium", "high"}:
                        errors.append(f"{path}.confidence: must be one of low|medium|high")
                if "sources" in item and _expect_type(errors, item["sources"], list, f"{path}.sources"):
                    if not item["sources"]:
                        errors.append(f"{path}.sources: must not be empty")
                    for j, src in enumerate(item["sources"]):
                        sp = f"{path}.sources[{j}]"
                        if _expect_type(errors, src, str, sp):
                            if not URL_RE.match(src):
                                errors.append(f"{sp}: must start with https://")

    if "strategy_adjustments" in data:
        sa = data["strategy_adjustments"]
        if _expect_type(errors, sa, list, "$.strategy_adjustments"):
            if not sa:
                errors.append("$.strategy_adjustments: must not be empty")
            required = {"priority", "recommendation", "justification", "owner", "kpi", "timeframe"}
            for i, item in enumerate(sa):
                path = f"$.strategy_adjustments[{i}]"
                if not _expect_type(errors, item, dict, path):
                    continue
                _expect_keys(errors, item, required, required, path)
                if "priority" in item and _expect_type(errors, item["priority"], str, f"{path}.priority"):
                    if item["priority"] not in {"P0", "P1", "P2", "P3"}:
                        errors.append(f"{path}.priority: must be one of P0|P1|P2|P3")
                for k in ["recommendation", "justification", "owner", "kpi", "timeframe"]:
                    if k in item and _expect_type(errors, item[k], str, f"{path}.{k}") and not item[k]:
                        errors.append(f"{path}.{k}: must not be empty")

    if "monitoring_plan" in data:
        mp = data["monitoring_plan"]
        req = {"cadence", "watch_signals", "decision_rules"}
        if _expect_type(errors, mp, dict, "$.monitoring_plan"):
            _expect_keys(errors, mp, req, req, "$.monitoring_plan")
            if "cadence" in mp and _expect_type(errors, mp["cadence"], str, "$.monitoring_plan.cadence") and not mp["cadence"]:
                errors.append("$.monitoring_plan.cadence: must not be empty")
            for key in ["watch_signals", "decision_rules"]:
                p = f"$.monitoring_plan.{key}"
                if key in mp and _expect_type(errors, mp[key], list, p):
                    if not mp[key]:
                        errors.append(f"{p}: must not be empty")
                    for i, val in enumerate(mp[key]):
                        vp = f"{p}[{i}]"
                        if _expect_type(errors, val, str, vp) and not val:
                            errors.append(f"{vp}: must not be empty")

    return errors


def validate_with_jsonschema(instance, schema):
    try:
        import jsonschema
    except Exception:
        return None, "jsonschema package not installed; using fallback validator"

    errors = sorted(jsonschema.Draft202012Validator(schema).iter_errors(instance), key=lambda e: list(e.path))
    if not errors:
        return [], "validated with jsonschema"

    rendered = []
    for e in errors:
        pointer = "$"
        for p in e.path:
            if isinstance(p, int):
                pointer += f"[{p}]"
            else:
                pointer += f".{p}"
        rendered.append(f"{pointer}: {e.message}")
    return rendered, "validated with jsonschema"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("data", help="Path to JSON data file")
    parser.add_argument(
        "--schema",
        default=str(Path(__file__).resolve().parent / "algorithm-update-brief.schema.json"),
        help="Path to JSON Schema file",
    )
    args = parser.parse_args()

    data = load_json(args.data)
    schema = load_json(args.schema)

    js_errors, mode = validate_with_jsonschema(data, schema)
    if js_errors is None:
        print(mode)
        fb_errors = validate_fallback(data)
        if fb_errors:
            print("INVALID")
            for err in fb_errors:
                print(f"- {err}")
            sys.exit(1)
        print("VALID (fallback)")
        sys.exit(0)

    if js_errors:
        print(mode)
        print("INVALID")
        for err in js_errors:
            print(f"- {err}")
        sys.exit(1)

    print(mode)
    print("VALID")


if __name__ == "__main__":
    main()
