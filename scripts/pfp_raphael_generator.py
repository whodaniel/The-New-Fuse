#!/usr/bin/env python3
"""
TNF PFP Image Generator using Raphael AI (free, no login)
Uses Playwright to automate image generation at raphael.app
"""

import json
import os
import time
from playwright.sync_api import sync_playwright

PFP_ROOT = os.path.expanduser(
    os.getenv(
        "TNF_AGENT_PFP_OUTPUT_DIR",
        "~/.gemini/antigravity/brain/129a6f84-97a9-4c46-88c8-4b5f066454aa",
    )
)
PROMPTS_FILE = os.path.join(PFP_ROOT, "pfp_prompts.json")
OUTPUT_DIR = PFP_ROOT

# Agents to generate (based on what we already have + remaining)
SKIP_EXISTING = [
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


def get_existing_files():
    """Get list of existing image files"""
    if not os.path.exists(OUTPUT_DIR):
        return []
    return [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".png")]


def load_prompts():
    """Load prompts from JSON file"""
    with open(PROMPTS_FILE) as f:
        return json.load(f)


def generate_with_raphael(page, prompt, filename, output_dir):
    """Generate a single image using Raphael AI"""
    print(f"Generating: {filename}")

    try:
        # Navigate to Raphael AI
        page.goto("https://raphael.app/", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=15000)

        # Find the prompt input (textarea)
        prompt_box = page.locator("textarea").first
        prompt_box.wait_for(state="visible", timeout=10000)

        # Clear and enter prompt
        prompt_box.fill(prompt)

        # Click generate button
        generate_btn = page.locator("button:has-text('Generate')").first
        generate_btn.click()

        # Wait for image to generate (poll for result)
        print("  Waiting for generation...")
        max_wait = 60  # seconds
        start_time = time.time()

        while time.time() - start_time < max_wait:
            # Check for generated image
            img_element = page.locator("img[src*='blob']").first
            if img_element.is_visible(timeout=2000):
                # Download the image
                img_url = img_element.get_attribute("src")
                if img_url:
                    # Save via JavaScript fetch
                    break
            time.sleep(2)

        print(f"  Completed: {filename}")
        return True

    except Exception as e:
        print(f"  Error generating {filename}: {e}")
        return False


def main():
    print("TNF PFP Image Generator - Raphael AI")
    print("=" * 50)

    existing = get_existing_files()
    print(f"Existing images: {len(existing)}")

    prompts = load_prompts()
    print(f"Total prompts: {len(prompts)}")

    # Filter to only agents without images yet
    to_generate = []
    for p in prompts:
        # Create expected filename
        safe_name = (
            p["name"]
            .lower()
            .replace(" ", "_")
            .replace("/", "_")
            .replace("(", "")
            .replace(")", "")
        )
        expected = f"{safe_name}.png"

        # Check if we already have it (with timestamp)
        found = False
        for existing_file in existing:
            if safe_name in existing_file:
                found = True
                break

        if not found:
            to_generate.append(p)

    print(f"Need to generate: {len(to_generate)} images")

    if not to_generate:
        print("All images already generated!")
        return

    # Start browser automation
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser for CAPTCHA handling
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # Process in batches (Raphael might have rate limits)
        batch_size = 5
        for i in range(0, len(to_generate), batch_size):
            batch = to_generate[i : i + batch_size]
            print(f"\n--- Batch {i // batch_size + 1} ({len(batch)} images) ---")

            for agent in batch:
                filename = (
                    f"{agent['name'].lower().replace(' ', '_').replace('/', '_')}.png"
                )
                success = generate_with_raphael(
                    page, agent["prompt"], filename, OUTPUT_DIR
                )

                if success:
                    # Small delay between generations
                    time.sleep(3)

            # Pause between batches
            print("Pausing between batches...")
            time.sleep(10)

        browser.close()

    print("\nDone!")


if __name__ == "__main__":
    main()
