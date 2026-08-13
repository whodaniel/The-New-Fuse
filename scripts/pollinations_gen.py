#!/usr/bin/env python3
"""Generate TNF Agent PFPs using Pollinations.ai free API (no key required!)"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
import argparse

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

GENERATED_PROMPTS = {
    "ab-testing-optimizer-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 30-year-old Japanese female humanoid operator. Her skin is flawless texture but distinct character. Her expression is analytical, inventive, relentlessly curious, and hyper-focused. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. AB Testing Optimizer Agent. Specialties visible through props and costume language: metric prisms, test matrices, performance arcs, testing emblem accents. Color story: violet, cyan, silver. Wardrobe: precision lab coat with premium technical tailoring and signal filaments. Environment: experimentation chamber with metric walls, split-test projections, and data arcs.",
    "ad-network-manager-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 49-year-old mixed-heritage male humanoid operator. Mature skin with a commanding, seasoned texture. Expression is focused, calm, deeply technical, and scrutinizing. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Ad Network Manager Agent. Terminal glyphs, data conduits, schematic overlays, network emblem accents. Color: navy, electric blue, titanium. Utility jacket with modular tooling. Server forge environment.",
    "affiliate-link-manager-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition. 34-year-old East Asian male. Vibrant clear skin. Focused, calm, technical expression. Tactile analog-cybernetic wardrobe, photoreal texture, retro-futurist hardware. Clean studio lighting, realistic, no cartoon. Affiliate Link Manager Agent. Terminal glyphs, data conduits. Navy, electric blue, titanium. Utility jacket. Server forge background.",
    "agent-registry-manager": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 45-year-old Middle-Eastern female. Textured experienced skin. Focused, technical expression. Tactile wardrobe, photoreal skin. Server forge environment. Agent Registry Manager. Terminal glyphs, data conduits. Navy blue, electric blue, titanium. Utility jacket.",
    "agent-relationship-grapher": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 46-year-old Japanese male. Experienced skin. Strategic, decisive, commanding expression. Tactile wardrobe, photoreal. Strategic operations deck with floating constellations. Agent Relationship Grapher. Node constellations, route lines. Royal blue, white gold, graphite. Command mantle.",
    "agent-search-engine": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 54-year-old Indigenous female. Experienced skin. Strategic, commanding expression. Command mantle. Strategic operations deck. Agent Search Engine. Node constellations, route lines. Royal blue, white gold, graphite.",
    "agent-tagger": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 29-year-old African-American male. Flawless skin. Strategic, commanding expression. Command mantle. Operations deck. Agent Tagger. Node constellations, route lines. Royal blue, white gold, graphite.",
    "news-scout": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 27-year-old Sub-Saharan African male. Supple unblemished skin. Contemplative, analytical gaze. Sleek long coat. Evidence wall with floating clues. AI News Scout. Timeline strands, sensor halos. Indigo, cyan, silver.",
    "algorithm-adaptation-agent": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 41-year-old East Asian female. Well-maintained skin. Charismatic, imaginative expression. Tailored creative suit. Editorial studio with cinematic gels. Algorithm Adaptation Agent. Lens flares, storyboards. Magenta, amber, graphite.",
    "analytics-and-reporting-agent": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 33-year-old Scandinavian female. Vibrant clear skin. Focused, technical expression. Utility jacket. Server forge. Analytics And Reporting Agent. Terminal glyphs. Navy, electric blue, titanium.",
    "asset-sourcer-agent": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 31-year-old Middle-Eastern male. Clear youthful skin. Stern, vigilant expression. Armored midnight trench. Command bunker with shields. Asset Sourcer Agent. Threat-map holograms, shield glyphs. Obsidian, emerald, gunmetal.",
    "audience-growth-agent": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 25-year-old African-American female. Smooth radiant skin. Bright, engaging expression. Utility jacket. Server forge with growth curves. Audience Growth Agent. Terminal glyphs. Navy, electric blue, titanium.",
    "audience-persona-architect-agent": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 48-year-old Scandinavian male. Weathered skin. Deep in thought, analytical expression. Utility jacket. Server forge with demographic matrices. Audience Persona Architect Agent. Terminal glyphs. Navy, electric blue, titanium.",
    "audience-segmentation-agent": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 32-year-old Middle-Eastern female. Clear skin. Hyper-focused, scrutinizing expression. Utility jacket with data visors. Server forge with heat maps. Audience Segmentation Agent. Terminal glyphs. Navy, electric blue, titanium.",
    "audio-recording-agent": "Future-retro ultra realistic humanoid portrait, cinematic sci-fi editorial, chest-up. 40-year-old South Asian male. Well-maintained skin. Listening intently expression. Precision lab coat with retro-tech earpiece. Experimentation chamber with waveform projections. Audio Recording Agent. Waveform visualizations, metric prisms. Violet, cyan, silver.",
}

ALREADY_GENERATED = [
    "ab_testing_optimizer_agent_1774304086920.png",
    "ad_network_manager_agent_1774305735621.png",
    "affiliate_link_manager_agent_1774305748094.png",
    "agent_registry_manager_1774305763415.png",
    "agent_relationship_grapher_1774305820466.png",
    "agent_search_engine_1774305841346.png",
    "agent_tagger_1774305884328.png",
    "ai_news_scout_agent_1774305900546.png",
    "algorithm_adaptation_agent_1774305915559.png",
    "analytics_and_reporting_agent_1774305928440.png",
    "asset_sourcer_agent_1774305940827.png",
    "audience_growth_agent_1774306147413.png",
    "audience_persona_architect_agent_1774306174910.png",
    "audience_segmentation_agent_1774306195606.png",
    "audio_recording_agent_1774306220405.png",
]


def generate_prompt(agent_id, agent_data):
    if agent_id in GENERATED_PROMPTS:
        return GENERATED_PROMPTS[agent_id]

    role = agent_data.get("role", "systems forge engineer")
    name = agent_data.get("displayName", agent_data.get("name", agent_id))
    desc = agent_data.get("description", "")[:200]

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
        "systems forge engineer": "South Asian male",
        "orchestration commander": "European female",
        "optimization scientist": "East Asian female",
        "retro-future studio director": "Latin American female",
        "signal detective analyst": "African-American male",
        "security sentinel": "Middle-Eastern male",
        "future-retro specialist": "Japanese female",
    }

    role_backgrounds = {
        "systems forge engineer": "server forge with transparent terminals, data conduits",
        "orchestration commander": "strategic operations deck with floating workflow constellations",
        "optimization scientist": "experimentation chamber with metric walls, data projections",
        "retro-future studio director": "editorial studio with cinematic gels, production consoles",
        "signal detective analyst": "evidence wall of floating clues, signal traces",
        "security sentinel": "command bunker with holographic shield interfaces",
        "future-retro specialist": "sci-fi portrait studio with signal architecture",
    }

    role_colors = {
        "systems forge engineer": "navy, electric blue, titanium",
        "orchestration commander": "royal blue, white gold, graphite",
        "optimization scientist": "violet, cyan, silver",
        "retro-future studio director": "magenta, amber, graphite",
        "signal detective analyst": "indigo, cyan, silver",
        "security sentinel": "obsidian, emerald, gunmetal",
        "future-retro specialist": "slate, silver, electric blue",
    }

    age = role_ages.get(role, "35")
    ethnicity = role_ethnicities.get(role, "diverse human")
    background = role_backgrounds.get(role, "server forge")
    colors = role_colors.get(role, "navy, cyan, silver")

    return f"""Future-retro ultra realistic humanoid portrait, premium cinematic sci-fi editorial photography, chest-up composition, 1:1 profile image. {age}-year-old {ethnicity} humanoid operator. Professional focused expression. Tactile analog-cybernetic wardrobe, photoreal skin texture, retro-futurist hardware, clean studio lighting, grounded realism, no cartoon. {name}. {desc} Color story: {colors}. Environment: {background}."""


def load_agents():
    with open(AGENTS_JSON_PATH) as f:
        return json.load(f)


def get_existing_images():
    if not OUTPUT_DIR.exists():
        return set()
    return set(p.name for p in OUTPUT_DIR.glob("*.png"))


def generate_image(agent_id, prompt, output_dir):
    timestamp = int(time.time() * 1000)
    filename = f"{agent_id.replace('-', '_')}_{timestamp}.png"
    output_path = output_dir / filename

    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            },
        )

        with urllib.request.urlopen(req, timeout=60) as response:
            image_data = response.read()
            output_path.write_bytes(image_data)

        return True, filename

    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.reason}"
    except Exception as e:
        return False, str(e)


def main():
    parser = argparse.ArgumentParser(
        description="Generate TNF Agent PFPs via Pollinations.ai"
    )
    parser.add_argument(
        "--delay", "-d", type=int, default=3, help="Delay between generations"
    )
    parser.add_argument("--start", "-s", type=int, default=0, help="Start index")
    parser.add_argument("--limit", "-l", type=int, default=100, help="Max to generate")
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

        already_done = False
        for generated in ALREADY_GENERATED:
            if agent_id.replace("-", "_") in generated:
                already_done = True
                break

        if already_done:
            print(f"[SKIP] {agent_id} (already done)")
            skipped += 1
            continue

        print(f"[GENERATING] {agent_id}...")
        prompt = generate_prompt(agent_id, agent)

        ok, result = generate_image(agent_id, prompt, OUTPUT_DIR)
        total += 1

        if ok:
            print(f"[SUCCESS] {agent_id} -> {result}")
            success += 1
        else:
            print(f"[FAILED] {agent_id}: {result}")
            failed += 1

        time.sleep(args.delay)

    print(f"\n=== SUMMARY ===")
    print(f"Total processed: {total}")
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")


if __name__ == "__main__":
    main()
