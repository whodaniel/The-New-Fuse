#!/usr/bin/env python3
"""
TNF PFP Batch Generator
Uses free image generation APIs to create agent PFPs in bulk.
"""

import json
import os
import time
import subprocess
from pathlib import Path

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
AGENTS_JSON = os.path.join(PROJECT_ROOT, "data", "agent-registry", "agents.json")
OUTPUT_DIR = os.getenv(
    "TNF_AGENT_PFP_OUTPUT_DIR",
    os.path.join(
        os.path.expanduser("~"),
        ".gemini",
        "antigravity",
        "brain",
        "129a6f84-97a9-4c46-88c8-4b5f066454aa",
    ),
)

# Custom agent profiles with specific details
CUSTOM_PROFILES = {
    "audience-growth-agent": {
        "age": "25",
        "ethnicity": "African-American female",
        "skin": "smooth, radiant skin",
        "expression": "bright, engaging, optimistic, yet sharply tactical and highly responsive",
        "background_detail": "showing upward growth curves and engagement metrics",
    },
    "audience-persona-architect-agent": {
        "age": "48",
        "ethnicity": "Scandinavian male",
        "skin": "believable age lines and weathering from intense psychological profiling",
        "expression": "deep in thought, contemplative, architectural, and analytical with intense, appraising gaze",
        "background_detail": "showing demographic breakdowns and psychological matrices",
    },
    "audience-segmentation-agent": {
        "age": "32",
        "ethnicity": "Middle-Eastern female",
        "skin": "clear and unweathered",
        "expression": "hyper-focused, scrutinizing, with look of intense mathematical precision, dissecting data segments with her eyes",
        "background_detail": "showing segmented heat maps and behavioral clusters",
    },
    "audio-recording-agent": {
        "age": "40",
        "ethnicity": "South Asian male",
        "skin": "well-maintained skin showing seasoned professionalism",
        "expression": "listening intently, head tilted slightly, deeply concentrated as if hearing frequencies others cannot",
        "background_detail": "with audio waveform projections and metric walls",
    },
    "auth-blocker-sentinel": {
        "age": "53",
        "ethnicity": "Japanese female",
        "skin": "weathered yet resilient, with distinct character lines marking years of service",
        "expression": "stern, unyielding, highly alert, vigilant, and unmistakably authoritarian",
        "background_detail": "serving as a security checkpoint with signal architecture",
    },
}


def load_agents():
    with open(AGENTS_JSON) as f:
        return json.load(f)


def get_role_archetype(role_text):
    """Map role to archetype for prompt generation"""
    role_lower = role_text.lower() if role_text else ""
    if "systems" in role_lower or "builder" in role_lower:
        return "systems forge engineer"
    elif "orchestration" in role_lower or "command" in role_lower:
        return "orchestration commander"
    elif "optimization" in role_lower or "scientist" in role_lower:
        return "optimization scientist"
    elif "creative" in role_lower or "studio" in role_lower:
        return "retro-future studio director"
    elif "scout" in role_lower or "detective" in role_lower:
        return "signal detective analyst"
    elif "security" in role_lower or "sentinel" in role_lower:
        return "security sentinel"
    else:
        return "future-retro specialist"


def get_age_for_role(archetype):
    """Get appropriate age based on role archetype"""
    ages = {
        "systems forge engineer": (30, 55),
        "orchestration commander": (27, 54),
        "optimization scientist": (26, 55),
        "retro-future studio director": (26, 52),
        "signal detective analyst": (27, 52),
        "security sentinel": (28, 54),
        "future-retro specialist": (29, 53),
    }
    return ages.get(archetype, (35, 45))


def get_ethnicity_by_index(index):
    ethnicities = [
        "Japanese",
        "East Asian",
        "South Asian",
        "African-American",
        "Scandinavian",
        "Middle-Eastern",
        "Mediterranean",
        "Latino",
        "Indigenous",
        "Sub-Saharan African",
        "mixed-heritage",
        "Southeast Asian",
    ]
    return ethnicities[index % len(ethnicities)]


def generate_pfp_prompt(agent, index):
    """Generate the full PFP prompt for an agent"""

    # Get custom profile if available
    custom = CUSTOM_PROFILES.get(agent.get("id", ""))

    archetype = get_role_archetype(agent.get("description", ""))
    age_min, age_max = get_age_for_role(archetype)

    # Use custom or generate based on index
    if custom:
        age = custom["age"]
        ethnicity = custom["ethnicity"]
        skin = custom["skin"]
        expression = custom["expression"]
        bg_detail = custom.get("background_detail", "")
    else:
        age = str(age_min + (index % (age_max - age_min)))
        ethnicity = get_ethnicity_by_index(index)
        skin = "well-defined skin texture with character"
        expression = "focused, intentional, highly competent"
        bg_detail = ""

    # Role-specific details
    role_details = {
        "systems forge engineer": {
            "color_story": "navy, electric blue, titanium",
            "wardrobe": "utility jacket with modular tooling, diagnostic cables, and metal fasteners",
            "background": "server forge with transparent terminals and orchestration schematics"
            + (f", {bg_detail}" if bg_detail else ""),
            "motifs": ["terminal glyphs", "data conduits", "schematic overlays"],
        },
        "orchestration commander": {
            "color_story": "royal blue, white gold, graphite",
            "wardrobe": "command mantle with polished tactical detailing and luminous trim",
            "background": "strategic operations deck with floating workflow constellations and route lines"
            + (f", {bg_detail}" if bg_detail else ""),
            "motifs": ["node constellations", "route lines", "command seals"],
        },
        "optimization scientist": {
            "color_story": "violet, cyan, silver",
            "wardrobe": "precision lab coat with premium technical tailoring and signal filaments",
            "background": "experimentation chamber with metric walls and split-test projections"
            + (f", {bg_detail}" if bg_detail else ""),
            "motifs": ["metric prisms", "test matrices", "performance arcs"],
        },
        "retro-future studio director": {
            "color_story": "magenta, amber, graphite",
            "wardrobe": "tailored creative suit with luminous trim and tactile fabrics",
            "background": "editorial studio with cinematic gels, production consoles, and storyboards"
            + (f", {bg_detail}" if bg_detail else ""),
            "motifs": ["lens flares", "storyboards", "analog controls"],
        },
        "signal detective analyst": {
            "color_story": "indigo, cyan, silver",
            "wardrobe": "sleek long coat with archival hardware and sensor threads",
            "background": "evidence wall of floating clues, signal traces, and data fragments"
            + (f", {bg_detail}" if bg_detail else ""),
            "motifs": ["timeline strands", "sensor halos", "data fragments"],
        },
        "security sentinel": {
            "color_story": "obsidian, emerald, gunmetal",
            "wardrobe": "armored midnight trench with luminous emerald seam work",
            "background": "quiet command bunker with holographic shield interfaces and access checkpoints"
            + (f", {bg_detail}" if bg_detail else ""),
            "motifs": ["threat-map holograms", "shield glyphs", "forensic lenses"],
        },
        "future-retro specialist": {
            "color_story": "slate, silver, electric blue",
            "wardrobe": "refined retro-future tailoring with premium technical details",
            "background": "sleek, retro-future workspace tailored to specialized protocol"
            + (f", {bg_detail}" if bg_detail else ""),
            "motifs": ["signal rings", "precision hardware", "ambient light traces"],
        },
    }

    details = role_details.get(archetype, role_details["future-retro specialist"])

    prompt = f"""Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing. A {age}-year-old {ethnicity} humanoid operator. Their skin is {skin}. Their expression is {expression}. Tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image. {agent.get("displayName", agent.get("name", "Agent"))} interpreted as a {archetype}. Core role: {agent.get("description", "AI agent")[:200]}. Color story: {details["color_story"]}. Wardrobe: {details["wardrobe"]}. Environment: {details["background"]}. Visual motifs: {", ".join(details["motifs"])}. Make the subject look like a memorable humanoid operator with strong personality, deeply intelligent eyes, and premium retro-future craftsmanship."""

    return prompt, archetype


def main():
    print("TNF PFP Batch Generator")
    print("=" * 50)

    # Load agents
    agents = load_agents()
    print(f"Loaded {len(agents)} agents")

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate prompts for all agents
    prompts = []
    for i, agent in enumerate(agents):
        prompt, archetype = generate_pfp_prompt(agent, i)
        prompts.append(
            {
                "id": agent.get("id", f"agent_{i}"),
                "name": agent.get("displayName", agent.get("name", f"Agent {i}")),
                "prompt": prompt,
                "archetype": archetype,
            }
        )
        print(f"[{i + 1}] {agent.get('displayName', agent.get('name'))} ({archetype})")

    # Save prompts to file for reference
    prompts_file = os.path.join(OUTPUT_DIR, "pfp_prompts.json")
    with open(prompts_file, "w") as f:
        json.dump(prompts, f, indent=2)

    print(f"\nSaved {len(prompts)} prompts to {prompts_file}")
    print("\nTo generate images, use one of these methods:")
    print("1. Copy prompts to raphael.app (free, no login)")
    print("2. Use Gemini API with rate limit handling")
    print("3. Use local image_gen.py with OPENAI_API_KEY set")

    return prompts


if __name__ == "__main__":
    main()
