#!/usr/bin/env python3
"""
Build a deterministic relationship-dynamics prompt payload from two personality
test result JSON files.

The AI5 directive describes a live ChatGPT interaction. This harness makes that
interaction reproducible: it preserves the exact prompt, validates both JSON
inputs, extracts comparable signals, and can produce an offline analysis for
review or a model-ready payload for a later live run.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import tempfile
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence, Tuple


EXACT_PROMPT = "Without knowing anything about this couple, tell us about their relationship."

NOISY_KEY_RE = re.compile(
    r"(?:^|_)(?:id|uuid|date|time|timestamp|created|updated|duration|elapsed|index|order|version|source)(?:_|$)"
)


def normalized_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def is_noisy_path(path: Sequence[str]) -> bool:
    return any(NOISY_KEY_RE.search(normalized_key(part)) for part in path)


def label_for_path(path: Sequence[str]) -> str:
    cleaned = [part for part in path if part and not part.isdigit()]
    if not cleaned:
        return "value"
    if normalized_key(cleaned[-1]) in {"score", "value", "rawscore", "percentile", "result"} and len(cleaned) > 1:
        return ".".join(cleaned[-3:-1])
    return ".".join(cleaned[-3:])


def walk_json(value: Any, path: Sequence[str] = ()) -> Iterable[Tuple[Tuple[str, ...], Any]]:
    if isinstance(value, dict):
        for key, nested in value.items():
            yield from walk_json(nested, (*path, str(key)))
    elif isinstance(value, list):
        for index, nested in enumerate(value):
            yield from walk_json(nested, (*path, str(index)))
    else:
        yield tuple(path), value


def find_by_normalized_key(data: Dict[str, Any], candidates: Sequence[str]) -> Any:
    wanted = {normalized_key(candidate) for candidate in candidates}
    for key, value in data.items():
        if normalized_key(str(key)) in wanted:
            return value
    return None


def collect_question_answers(value: Any, out: Dict[str, str]) -> None:
    if isinstance(value, dict):
        question = find_by_normalized_key(value, ("question", "prompt", "item", "label", "text"))
        answer = find_by_normalized_key(value, ("answer", "choice", "response", "selected", "option"))
        if isinstance(question, str) and question.strip() and answer is not None:
            out[f"answer.{normalized_key(question)}"] = str(answer).strip()
        for nested in value.values():
            collect_question_answers(nested, out)
    elif isinstance(value, list):
        for nested in value:
            collect_question_answers(nested, out)


def extract_profile(data: Any) -> Dict[str, Any]:
    scores: Dict[str, float] = {}
    categorical: Dict[str, str] = {}
    answer_count = 0

    collect_question_answers(data, categorical)
    answer_count = len(categorical)

    for path, value in walk_json(data):
        if not path or is_noisy_path(path):
            continue
        label = label_for_path(path)
        key = normalized_key(label)
        if not key:
            continue
        if finite_number(value):
            scores[key] = float(value)
            continue
        if isinstance(value, str) and value.strip():
            leaf = normalized_key(path[-1])
            if leaf in {"answer", "choice", "response", "selected", "option", "value", "result", "type", "trait"}:
                categorical[key] = value.strip()
                answer_count += 1
        elif isinstance(value, bool):
            categorical[key] = str(value).lower()
            answer_count += 1

    return {
        "scores": scores,
        "categorical": categorical,
        "scoreCount": len(scores),
        "categoricalCount": len(categorical),
        "answerCount": answer_count,
    }


def compare_scores(a_scores: Dict[str, float], b_scores: Dict[str, float]) -> Dict[str, Any]:
    common_keys = sorted(set(a_scores) & set(b_scores))
    comparisons: List[Dict[str, Any]] = []
    for key in common_keys:
        a_value = a_scores[key]
        b_value = b_scores[key]
        delta = b_value - a_value
        scale = max(abs(a_value), abs(b_value), 1.0)
        comparisons.append(
            {
                "dimension": key,
                "partnerA": a_value,
                "partnerB": b_value,
                "delta": round(delta, 4),
                "relativeDelta": round(delta / scale, 4),
            }
        )

    similarities = sorted(comparisons, key=lambda item: abs(float(item["relativeDelta"])))[:8]
    contrasts = sorted(comparisons, key=lambda item: abs(float(item["relativeDelta"])), reverse=True)[:8]
    return {
        "commonDimensions": len(common_keys),
        "similarities": similarities,
        "contrasts": contrasts,
    }


def compare_categories(a_values: Dict[str, str], b_values: Dict[str, str]) -> Dict[str, Any]:
    common_keys = sorted(set(a_values) & set(b_values))
    matches: List[Dict[str, str]] = []
    differences: List[Dict[str, str]] = []
    for key in common_keys:
        a_value = a_values[key]
        b_value = b_values[key]
        item = {"dimension": key, "partnerA": a_value, "partnerB": b_value}
        if normalized_key(a_value) == normalized_key(b_value):
            matches.append(item)
        else:
            differences.append(item)
    return {
        "commonDimensions": len(common_keys),
        "matches": matches[:12],
        "differences": differences[:12],
        "matchRate": round(len(matches) / len(common_keys), 4) if common_keys else 0.0,
    }


def relationship_summary(score_comparison: Dict[str, Any], category_comparison: Dict[str, Any]) -> List[str]:
    lines: List[str] = []
    common_scores = int(score_comparison["commonDimensions"])
    common_categories = int(category_comparison["commonDimensions"])
    if common_scores:
        lines.append(f"Comparable numeric dimensions: {common_scores}.")
        contrasts = score_comparison["contrasts"]
        if contrasts:
            top = contrasts[0]
            direction = "partner B scores higher" if top["delta"] > 0 else "partner A scores higher"
            lines.append(f"Primary numeric contrast: {top['dimension']} where {direction}.")
        if score_comparison["similarities"]:
            shared = ", ".join(item["dimension"] for item in score_comparison["similarities"][:3])
            lines.append(f"Most aligned numeric dimensions: {shared}.")
    if common_categories:
        lines.append(
            f"Comparable categorical dimensions: {common_categories}; exact match rate {category_comparison['matchRate']:.0%}."
        )
        if category_comparison["differences"]:
            top = category_comparison["differences"][0]
            lines.append(f"Notable response contrast: {top['dimension']} differs between partners.")
    if not lines:
        lines.append("No comparable dimensions were detected; normalize the input schemas before model analysis.")
    return lines


def build_analysis(partner_a_path: Path, partner_b_path: Path) -> Dict[str, Any]:
    partner_a = read_json(partner_a_path)
    partner_b = read_json(partner_b_path)
    profile_a = extract_profile(partner_a)
    profile_b = extract_profile(partner_b)
    score_comparison = compare_scores(profile_a["scores"], profile_b["scores"])
    category_comparison = compare_categories(profile_a["categorical"], profile_b["categorical"])

    return {
        "prompt": EXACT_PROMPT,
        "inputs": {
            "partnerAPath": str(partner_a_path),
            "partnerBPath": str(partner_b_path),
            "partnerAStats": {
                "scoreCount": profile_a["scoreCount"],
                "categoricalCount": profile_a["categoricalCount"],
                "answerCount": profile_a["answerCount"],
            },
            "partnerBStats": {
                "scoreCount": profile_b["scoreCount"],
                "categoricalCount": profile_b["categoricalCount"],
                "answerCount": profile_b["answerCount"],
            },
        },
        "comparison": {
            "numeric": score_comparison,
            "categorical": category_comparison,
        },
        "offlineRelationshipSummary": relationship_summary(score_comparison, category_comparison),
        "modelPayload": {
            "system": "Analyze only the two provided personality-test result JSON objects. Do not infer biographical facts.",
            "user": EXACT_PROMPT,
            "attachments": [
                {"name": "partner1_results.json", "json": partner_a},
                {"name": "partner2_results.json", "json": partner_b},
            ],
        },
    }


def run_self_test() -> Dict[str, Any]:
    partner_a = {
        "name": "partner-a",
        "traits": {
            "openness": {"score": 82},
            "conscientiousness": {"score": 61},
            "conflict_style": {"score": 35},
        },
        "answers": [
            {"question": "Plans weekends early", "answer": "often"},
            {"question": "Needs downtime", "answer": "sometimes"},
        ],
    }
    partner_b = {
        "name": "partner-b",
        "traits": {
            "openness": {"score": 79},
            "conscientiousness": {"score": 38},
            "conflict_style": {"score": 72},
        },
        "answers": [
            {"question": "Plans weekends early", "answer": "rarely"},
            {"question": "Needs downtime", "answer": "sometimes"},
        ],
    }
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        a_path = root / "partner1_results.json"
        b_path = root / "partner2_results.json"
        write_json(a_path, partner_a)
        write_json(b_path, partner_b)
        result = build_analysis(a_path, b_path)

    assert result["prompt"] == EXACT_PROMPT
    assert result["comparison"]["numeric"]["commonDimensions"] == 3
    assert result["comparison"]["categorical"]["commonDimensions"] >= 2
    assert result["offlineRelationshipSummary"]
    return {"status": "passed", "summary": result["offlineRelationshipSummary"]}


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Analyze two personality-test result JSON files")
    parser.add_argument("--partner-a", help="Path to partner 1 JSON results")
    parser.add_argument("--partner-b", help="Path to partner 2 JSON results")
    parser.add_argument("--output", help="Path for analysis JSON output")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)

    if args.self_test:
        print(json.dumps(run_self_test(), indent=2))
        return 0

    if not args.partner_a or not args.partner_b:
        parser.error("--partner-a and --partner-b are required unless --self-test is used")

    result = build_analysis(Path(args.partner_a).resolve(), Path(args.partner_b).resolve())
    if args.output:
        write_json(Path(args.output).resolve(), result)
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main([] if False else __import__("sys").argv[1:]))
