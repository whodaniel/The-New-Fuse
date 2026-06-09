#!/usr/bin/env python3
"""Analyze relationship dynamics from two personality-result JSON files.

The Phase 7 directive asks for the exact model prompt plus two JSON result
files. This utility keeps that contract deterministic and private by producing
a local analysis artifact that can be reviewed or forwarded to a model later.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping


EXACT_PROMPT = "Without knowing anything about this couple, tell us about their relationship."
TRAIT_ALIASES = {
    "openness": ["openness", "open", "opentoexperience", "imagination"],
    "conscientiousness": ["conscientiousness", "conscientious", "discipline", "orderliness"],
    "extraversion": ["extraversion", "extroversion", "extraverted", "sociability"],
    "agreeableness": ["agreeableness", "agreeable", "cooperation", "compassion"],
    "neuroticism": ["neuroticism", "emotionalvolatility", "volatility", "stability"],
}


def normalize_key(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def flatten_json(value: Any, prefix: str = "") -> Iterable[tuple[str, Any]]:
    if isinstance(value, Mapping):
        for key, child in value.items():
            child_prefix = f"{prefix}.{key}" if prefix else str(key)
            yield from flatten_json(child, child_prefix)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            child_prefix = f"{prefix}.{index}" if prefix else str(index)
            yield from flatten_json(child, child_prefix)
    else:
        yield prefix, value


def coerce_score(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        score = float(value)
    elif isinstance(value, str):
        try:
            score = float(value.strip().rstrip("%"))
        except ValueError:
            return None
    else:
        return None

    if 0 <= score <= 1:
        score *= 100
    if 0 <= score <= 100:
        return round(score, 2)
    return None


def extract_traits(payload: Dict[str, Any]) -> Dict[str, float]:
    flattened = [(normalize_key(path.split(".")[-1]), value) for path, value in flatten_json(payload)]
    traits: Dict[str, float] = {}
    for trait, aliases in TRAIT_ALIASES.items():
        alias_tokens = [normalize_key(alias) for alias in aliases]
        for key, value in flattened:
            if any(alias in key or key in alias for alias in alias_tokens):
                score = coerce_score(value)
                if score is not None:
                    traits[trait] = score
                    break
    missing = sorted(set(TRAIT_ALIASES) - set(traits))
    if missing:
        raise ValueError(f"Missing trait scores: {', '.join(missing)}")
    return traits


def band(score: float) -> str:
    if score >= 67:
        return "high"
    if score <= 33:
        return "low"
    return "balanced"


def compare_traits(partner_a: Dict[str, float], partner_b: Dict[str, float]) -> Dict[str, Any]:
    comparisons = {}
    for trait in TRAIT_ALIASES:
        a_score = partner_a[trait]
        b_score = partner_b[trait]
        delta = round(abs(a_score - b_score), 2)
        comparisons[trait] = {
            "partnerA": a_score,
            "partnerB": b_score,
            "delta": delta,
            "alignment": "similar" if delta <= 15 else "complementary" if delta <= 35 else "high-contrast",
            "bands": {"partnerA": band(a_score), "partnerB": band(b_score)},
        }
    return comparisons


def generate_analysis(comparisons: Dict[str, Any]) -> Dict[str, Any]:
    high_contrast = [trait for trait, data in comparisons.items() if data["alignment"] == "high-contrast"]
    similar = [trait for trait, data in comparisons.items() if data["alignment"] == "similar"]
    opportunities = []
    strengths = []

    if "agreeableness" in similar:
        strengths.append("Conflict repair is likely easier when both partners show similar cooperation patterns.")
    if "conscientiousness" in similar:
        strengths.append("Shared planning tempo can make routines, finances, and follow-through easier to coordinate.")
    if "openness" in high_contrast:
        opportunities.append("Novelty versus familiarity may need explicit negotiation before large lifestyle changes.")
    if "extraversion" in high_contrast:
        opportunities.append("Social-energy mismatch should be handled with opt-in plans and recovery time.")
    if "neuroticism" in high_contrast:
        opportunities.append("Stress responses may differ; name support needs before conflict escalates.")

    return {
        "summary": (
            "The two profiles show a mix of shared operating patterns and contrast points. "
            "Treat the output as a hypothesis from test data, not a diagnosis or a verdict."
        ),
        "strengths": strengths or ["The available scores do not show a dominant shared-strength cluster."],
        "watchpoints": opportunities or ["No large trait contrast was detected from the supplied scores."],
        "sharedTraits": similar,
        "highContrastTraits": high_contrast,
    }


def analyze(partner_a_payload: Dict[str, Any], partner_b_payload: Dict[str, Any]) -> Dict[str, Any]:
    partner_a = extract_traits(partner_a_payload)
    partner_b = extract_traits(partner_b_payload)
    comparisons = compare_traits(partner_a, partner_b)
    return {
        "prompt": EXACT_PROMPT,
        "inputContract": {
            "partnerA": sorted(partner_a.keys()),
            "partnerB": sorted(partner_b.keys()),
            "scoreRange": "0-100",
        },
        "comparisons": comparisons,
        "analysis": generate_analysis(comparisons),
    }


def run_self_test() -> None:
    partner_a = {
        "answers": {
            "openness": 82,
            "conscientiousness": 74,
            "extraversion": 35,
            "agreeableness": 70,
            "neuroticism": 28,
        }
    }
    partner_b = {
        "traits": {
            "open_to_experience": 61,
            "discipline": 76,
            "sociability": 78,
            "cooperation": 68,
            "emotional_volatility": 44,
        }
    }
    result = analyze(partner_a, partner_b)
    assert result["prompt"] == EXACT_PROMPT
    assert result["comparisons"]["extraversion"]["alignment"] == "high-contrast"
    assert "extraversion" in result["analysis"]["highContrastTraits"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("partner_a", nargs="?", help="JSON file for partner A results")
    parser.add_argument("partner_b", nargs="?", help="JSON file for partner B results")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--output", help="Optional output JSON path")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        print(json.dumps({"status": "passed", "prompt": EXACT_PROMPT}, indent=2))
        return 0

    if not args.partner_a or not args.partner_b:
        parser.error("partner_a and partner_b are required unless --self-test is used")

    with Path(args.partner_a).open("r", encoding="utf-8") as handle:
        partner_a = json.load(handle)
    with Path(args.partner_b).open("r", encoding="utf-8") as handle:
        partner_b = json.load(handle)

    result = analyze(partner_a, partner_b)
    text = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(text + "\n", encoding="utf-8")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
