#!/usr/bin/env python3
"""Generate TNF Agent PFPs using imfinit API (free, no key)"""

import json
import os
import sys
import time
import requests
from pathlib import Path
import argparse
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
AGENTS_JSON_PATH = os.path.join(PROJECT_ROOT, "data", "agent-registry", "agents.json")
OUTPUT_DIR = Path(
    os.getenv(
        "TNF_AGENT_PFP_OUTPUT_DIR",
        os.path.join(
            os.path.expanduser("~"),
            ".gemini",
            "antigravity",
            "brain",
            "129a6f84-97a9-4c46-88c8-4b5f066454aa",
        ),
    )
)

ALREADY_GENERATED = {
    "ab-testing-optimizer-agent",
    "ad-network-manager-agent",
    "affiliate-link-manager-agent",
    "agent-registry-manager",
    "agent-relationship-grapher",
    "agent-search-engine",
    "agent-tagger",
    "news-scout",
    "algorithm-adaptation-agent",
    "analytics-and-reporting-agent",
    "asset-sourcer-agent",
    "audience-growth-agent",
    "audience-persona-architect-agent",
    "audience-segmentation-agent",
    "audio-recording-agent",
}


def generate_prompt(agent_id, agent_data):
    role = agent_data.get("role", "systems forge engineer")
    name = agent_data.get("displayName", agent_data.get("name", agent_id))
    desc = agent_data.get("description", "")[:150]
    desc = desc.encode("ascii", "ignore").decode("ascii")

    role_ages = {
        "systems forge engineer": "40",
        "orchestration commander": "45",
        "optimization scientist": "35",
        "retro-future studio director": "42",
        "signal detective analyst": "32",
        "security sentinel": "38",
        "future-retro specialist": "50",
    }

    role_ethnicities = {
        "systems forge engineer": "South Asian",
        "orchestration commander": "European",
        "optimization scientist": "East Asian",
        "retro-future studio director": "Latin American",
        "signal detective analyst": "African American",
        "security sentinel": "Middle Eastern",
        "future-retro specialist": "Japanese",
    }

    role_backgrounds = {
        "systems forge engineer": "server forge with glowing data terminals",
        "orchestration commander": "strategic command deck with holographic displays",
        "optimization scientist": "laboratory with metric projections",
        "retro-future studio director": "creative studio with cinematic lighting",
        "signal detective analyst": "analysis room with evidence walls",
        "security sentinel": "security bunker with shield interfaces",
        "future-retro specialist": "futuristic portrait studio",
    }

    age = role_ages.get(role, "35")
    ethnicity = role_ethnicities.get(role, "diverse")
    background = role_backgrounds.get(role, "futuristic studio")

    return f"""Future-retro ultra realistic humanoid portrait, premium cinematic sci-fi editorial photo, chest-up, 1:1 portrait. {age} year old {ethnicity} person. Professional focused expression. High-quality photorealistic skin texture. Tactile analog-cybernetic wardrobe with subtle tech elements. Clean dramatic studio lighting, realistic, no cartoon. {name}. {desc} Background: {background}."""


def load_agents():
    with open(AGENTS_JSON_PATH) as f:
        return json.load(f)


def get_existing_images():
    if not OUTPUT_DIR.exists():
        return set()
    return set(p.stem.split("_")[0].replace("_", "-") for p in OUTPUT_DIR.glob("*.png"))


def generate_image(agent_id, prompt, output_dir):
    timestamp = int(time.time() * 1000)
    filename = f"{agent_id.replace('-', '_')}_{timestamp}.png"
    output_path = output_dir / filename

    url = f"https://api.imfin.it/api/generate"
    params = {"prompt": prompt, "ar": "1:1", "model": "gemini", "reroll": "true"}

    try:
        response = requests.get(url, params=params, timeout=120, verify=False)
        response.raise_for_status()

        output_path.write_bytes(response.content)

        return True, filename

    except requests.exceptions.RequestException as e:
        return False, str(e)


def main():
    parser = argparse.ArgumentParser(
        description="Generate TNF Agent PFPs via imfinit API"
    )
    parser.add_argument(
        "--delay", "-d", type=int, default=2, help="Delay between generations"
    )
    parser.add_argument("--start", "-s", type=int, default=0, help="Start index")
    parser.add_argument("--limit", "-l", type=int, default=200, help="Max to generate")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    existing = get_existing_images()
    print(f"Found {len(existing)} existing images")

    agents = load_agents()
    print(f"Loaded {len(agents)} agents from registry")

    total = 0
    success = 0
    failed = 0
    skipped = 0

    agents_to_process = agents[args.start : args.start + args.limit]

    for idx, agent in enumerate(agents_to_process):
        agent_id = agent["id"]

        if agent_id in ALREADY_GENERATED:
            print(f"[SKIP] {agent_id} (already done)")
            skipped += 1
            continue

        print(f"[GENERATING] [{idx + 1}] {agent_id}...")
        prompt = generate_prompt(agent_id, agent)

        ok, result = generate_image(agent_id, prompt, OUTPUT_DIR)
        total += 1

        if ok:
            print(f"[SUCCESS] {agent_id} -> {result}")
            success += 1
            ALREADY_GENERATED.add(agent_id)
        else:
            print(f"[FAILED] {agent_id}: {result}")
            failed += 1

        time.sleep(args.delay)

    print(f"\n=== SUMMARY ===")
    print(f"Total processed: {total}")
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")

    remaining = len(agents) - len(ALREADY_GENERATED)
    print(f"Remaining: {remaining}")


if __name__ == "__main__":
    main()
