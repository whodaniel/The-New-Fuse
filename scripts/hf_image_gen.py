#!/usr/bin/env python3
"""Generate TNF Agent PFPs using Hugging Face Inference API (free tier)"""

import json
import os
import sys
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse

try:
    from huggingface_hub import InferenceClient
except ImportError:
    print("Installing huggingface_hub...")
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "huggingface_hub"])
    from huggingface_hub import InferenceClient

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
MODEL = "black-forest-labs/FLUX.1-schnell"

GENERATED_PROMPTS = {
    "ab-testing-optimizer-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 30-year-old Japanese female humanoid operator. Her skin is flawless texture but distinct character. Her expression is analytical, inventive, relentlessly curious, and hyper-focused. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. AB Testing Optimizer Agent. Specialties visible through props and costume language: metric prisms, test matrices, performance arcs, testing emblem accents. Color story: violet, cyan, silver. Wardrobe: precision lab coat with premium technical tailoring and signal filaments. Environment: experimentation chamber with metric walls, split-test projections, and data arcs.",
    "ad-network-manager-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 49-year-old mixed-heritage male humanoid operator. Her skin is mature skin with a commanding, seasoned texture. Her expression is focused, calm, deeply technical, and scrutinizing. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Ad Network Manager Agent. Specialties visible through props and costume language: terminal glyphs, data conduits, schematic overlays, network emblem accents. Color story: navy, electric blue, titanium. Wardrobe: utility jacket with modular tooling, diagnostic cables, and metal fasteners. Environment: server forge with transparent terminals, orchestration schematics, and data conduits.",
    "affiliate-link-manager-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 34-year-old East Asian male humanoid operator. Her skin is vibrant and clear skin. Her expression is focused, calm, deeply technical, and scrutinizing. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Affiliate Link Manager Agent. Specialties visible through props and costume language: terminal glyphs, data conduits, schematic overlays, affiliate emblem accents. Color story: navy, electric blue, titanium. Wardrobe: utility jacket with modular tooling, diagnostic cables, and metal fasteners. Environment: server forge with transparent terminals, orchestration schematics, and data conduits.",
    "agent-registry-manager": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 45-year-old Middle-Eastern female humanoid operator. Her skin is textured, experienced skin marking years of service. Her expression is focused, calm, deeply technical, and scrutinizing. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Agent Registry Manager. Specialties visible through props and costume language: terminal glyphs, data conduits, schematic overlays, registry emblem accents. Color story: navy, electric blue, titanium. Wardrobe: utility jacket with modular tooling, diagnostic cables, and metal fasteners. Environment: server forge with transparent terminals, orchestration schematics, and data conduits.",
    "agent-relationship-grapher": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 46-year-old Japanese male humanoid operator. Her skin is textured, experienced skin marking years of service. Her expression is strategic, decisive, composed, and commanding. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Agent Relationship Grapher. Specialties visible through props and costume language: node constellations, route lines, command seals, relationship emblem accents. Color story: royal blue, white gold, graphite. Wardrobe: command mantle with polished tactical detailing and luminous trim. Environment: strategic operations deck with floating workflow constellations and route lines.",
    "agent-search-engine": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 54-year-old Indigenous female humanoid operator. Her skin is textured, experienced skin marking years of service. Her expression is strategic, decisive, composed, and commanding. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Agent Search Engine. Specialties visible through props and costume language: node constellations, route lines, command seals, search emblem accents. Color story: royal blue, white gold, graphite. Wardrobe: command mantle with polished tactical detailing and luminous trim. Environment: strategic operations deck with floating workflow constellations and route lines.",
    "agent-tagger": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 29-year-old African-American male humanoid operator. Her skin is flawless texture but distinct character. Her expression is strategic, decisive, composed, and commanding. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Agent Tagger. Specialties visible through props and costume language: node constellations, route lines, command seals, tagger emblem accents. Color story: royal blue, white gold, graphite. Wardrobe: command mantle with polished tactical detailing and luminous trim. Environment: strategic operations deck with floating workflow constellations and route lines.",
    "news-scout": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 27-year-old Sub-Saharan African male humanoid operator. Her skin is supple, unblemished skin with a subtle glow. Her expression is contemplative, intensely analytical gaze, curious, sharp, and observant. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. AI News Scout Agent. Specialties visible through props and costume language: timeline strands, sensor halos, data fragments. Color story: indigo, cyan, silver. Wardrobe: sleek long coat with archival hardware and sensor threads. Environment: evidence wall of floating clues, signal traces, and data fragments.",
    "algorithm-adaptation-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 41-year-old East Asian female humanoid operator. Her skin is well-maintained skin showing seasoned professionalism. Her expression is charismatic, imaginative, highly intentional, and forward-thinking. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Algorithm Adaptation Agent. Specialties visible through props and costume language: lens flares, storyboards, analog controls, algorithm emblem accents. Color story: magenta, amber, graphite. Wardrobe: tailored creative suit with luminous trim and tactile fabrics. Environment: editorial studio with cinematic gels, production consoles, and storyboards.",
    "analytics-and-reporting-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 33-year-old Scandinavian female humanoid operator. Her skin is vibrant and clear skin. Her expression is focused, calm, deeply technical, and scrutinizing. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Analytics And Reporting Agent. Specialties visible through props and costume language: terminal glyphs, data conduits, schematic overlays, analytics emblem accents. Color story: navy, electric blue, titanium. Wardrobe: utility jacket with modular tooling, diagnostic cables, and metal fasteners. Environment: server forge with transparent terminals, orchestration schematics, and data conduits.",
    "asset-sourcer-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 31-year-old Middle-Eastern male humanoid operator. Her skin is clear skin with youthful vitality. Her expression is stern, unyielding, highly alert, vigilant, and unmistakably authoritarian. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Asset Sourcer Agent. Specialties visible through props and costume language: threat-map holograms, shield glyphs, forensic lenses, asset emblem accents. Color story: obsidian, emerald, gunmetal. Wardrobe: armored midnight trench with luminous emerald seam work. Environment: quiet command bunker with holographic shield interfaces and access checkpoints.",
    "audience-growth-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 25-year-old African-American female humanoid operator. Her skin is smooth, radiant skin. Her expression is bright, engaging, optimistic, yet sharply tactical and highly responsive. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Audience Growth Agent. Specialties visible through props and costume language: terminal glyphs, data conduits, schematic overlays, audience emblem accents. Color story: navy, electric blue, titanium. Wardrobe: utility jacket with modular tooling, diagnostic cables, and metal fasteners. Environment: server forge with transparent terminals showing upward growth curves and engagement metrics.",
    "audience-persona-architect-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 48-year-old Scandinavian male humanoid operator. Her skin is believable age lines and weathering from intense psychological profiling. Her expression is deep in thought, contemplative, architectural, and analytical with intense, appraising gaze. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Audience Persona Architect Agent. Specialties visible through props and costume language: terminal glyphs, data conduits, schematic overlays, audience emblem accents. Color story: navy, electric blue, titanium. Wardrobe: utility jacket with modular tooling, diagnostic cables, and metal fasteners. Environment: server forge with transparent terminals showing demographic breakdowns and psychological matrices.",
    "audience-segmentation-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 32-year-old Middle-Eastern female humanoid operator. Her skin is clear and unweathered. Her expression is hyper-focused, scrutinizing, with look of intense mathematical precision, dissecting data segments. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Audience Segmentation Agent. Specialties visible through props and costume language: terminal glyphs, data conduits, schematic overlays, audience emblem accents. Color story: navy, electric blue, titanium. Wardrobe: utility jacket with modular tooling, diagnostic cables, and multi-layered data visors. Environment: server forge with transparent terminals showing segmented heat maps and behavioral clusters.",
    "audio-recording-agent": "Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A 40-year-old South Asian male humanoid operator. Her skin is well-maintained skin showing seasoned professionalism. Her expression is listening intently, head tilted slightly, deeply concentrated as if hearing frequencies others cannot. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. Audio Recording Agent. Specialties visible through props and costume language: waveform visualizations, metric prisms, test matrices, performance arcs, audio emblem accents. Color story: violet, cyan, silver. Wardrobe: precision lab coat with premium technical tailoring and prominent asymmetrical retro-tech earpiece. Environment: sound-dampened experimentation chamber with metric walls and audio waveform projections.",
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
        "systems forge engineer": "server forge with transparent terminals, orchestration schematics, and data conduits",
        "orchestration commander": "strategic operations deck with floating workflow constellations and route lines",
        "optimization scientist": "experimentation chamber with metric walls, split-test projections, and data arcs",
        "retro-future studio director": "editorial studio with cinematic gels, production consoles, and storyboards",
        "signal detective analyst": "evidence wall of floating clues, signal traces, and data fragments",
        "security sentinel": "quiet command bunker with holographic shield interfaces and access checkpoints",
        "future-retro specialist": "clean sci-fi portrait studio with subtle signal architecture",
    }

    role_colors = {
        "systems forge engineer": ["navy", "electric blue", "titanium"],
        "orchestration commander": ["royal blue", "white gold", "graphite"],
        "optimization scientist": ["violet", "cyan", "silver"],
        "retro-future studio director": ["magenta", "amber", "graphite"],
        "signal detective analyst": ["indigo", "cyan", "silver"],
        "security sentinel": ["obsidian", "emerald", "gunmetal"],
        "future-retro specialist": ["slate", "silver", "electric blue"],
    }

    age = role_ages.get(role, "35")
    ethnicity = role_ethnicities.get(role, "diverse human")
    background = role_backgrounds.get(role, "server forge environment")
    colors = role_colors.get(role, ["navy", "cyan", "silver"])

    return f"""Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A {age}-year-old {ethnicity} humanoid operator. Photoreal skin texture. Expression: professional, focused, intelligent. Tactile analog-meets-cybernetic wardrobe, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. {name}. {desc} Color story: {", ".join(colors)}. Environment: {background}."""


def load_agents():
    with open(AGENTS_JSON_PATH) as f:
        return json.load(f)


def get_existing_images():
    if not OUTPUT_DIR.exists():
        return set()
    return set(p.name for p in OUTPUT_DIR.glob("*.png"))


def generate_image(client, agent_id, prompt, output_dir):
    filename = f"{agent_id.replace('-', '_')}_{int(time.time() * 1000)}.png"
    output_path = output_dir / filename

    try:
        image = client.text_to_image(
            prompt,
            model=MODEL,
            guidance_scale=3.5,
            num_inference_steps=8,
            seed=int(time.time() % 1000000),
        )
        image.save(output_path)
        return True, filename
    except Exception as e:
        return False, str(e)


def main():
    parser = argparse.ArgumentParser(description="Generate TNF Agent PFPs")
    parser.add_argument(
        "--token", "-t", help="Hugging Face token (or set HF_TOKEN env)"
    )
    parser.add_argument(
        "--concurrency", "-c", type=int, default=3, help="Concurrent generations"
    )
    parser.add_argument(
        "--delay", "-d", type=int, default=5, help="Delay between batches (seconds)"
    )
    args = parser.parse_args()

    token = args.token or os.environ.get("HF_TOKEN")
    if not token:
        print(
            "ERROR: HF_TOKEN not set. Get a free token at https://huggingface.co/settings/tokens"
        )
        print("Usage: export HF_TOKEN=hf_xxxxxxx")
        print("Or run: python hf_image_gen.py --token hf_xxxxxxx")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    existing = get_existing_images()
    print(f"Found {len(existing)} existing images")

    agents = load_agents()
    print(f"Loaded {len(agents)} agents from registry")

    client = InferenceClient(api_key=token)

    total = 0
    success = 0
    failed = 0
    skipped = 0

    for agent in agents:
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

        try:
            ok, result = generate_image(client, agent_id, prompt, OUTPUT_DIR)
            total += 1

            if ok:
                print(f"[SUCCESS] {agent_id} -> {result}")
                success += 1
            else:
                print(f"[FAILED] {agent_id}: {result}")
                failed += 1

        except Exception as e:
            print(f"[ERROR] {agent_id}: {e}")
            failed += 1

        time.sleep(args.delay)

    print(f"\n=== SUMMARY ===")
    print(f"Total processed: {total}")
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")


if __name__ == "__main__":
    main()
