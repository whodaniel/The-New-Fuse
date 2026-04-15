import os
import csv
import glob

MANIFEST_PATH = "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/docs/NANOBANANA_POKER_GRAPHICS_MANIFEST.csv"
OUTPUT_HTML = "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/docs/poker_asset_gallery.html"

DIR1 = "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/assets/poker"
DIR2 = "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/assets/poker/incoming"
DIR3 = "/path/to/.gemini/antigravity/brain/10fb84f8-6e8f-41e1-beb4-ba647f63f6ad"

GLOBAL_THEME = "Create production-ready game UI art for a multiplayer crypto poker app called \"AI-ARCADE.XYZ - POKER ROOM\". Universe: ai-arcade adjacent sci-fantasy; premium, trustworthy, technical, cinematic. Material language: glassmorphism, frosted holographic panels, brushed metal accents, carbon microtexture. Lighting: soft volumetric glow, subtle neon edge lighting, no overblown bloom. Mood: calm confidence + high-stakes precision; cyborg-and-bot compatible space-tech aesthetic. "

html_content = [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    "<meta charset='utf-8'>",
    "<title>Poker Asset Gallery Pipeline</title>",
    "<style>",
    "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1a1a24; color: #e0e0e0; padding: 20px; }",
    "h1 { color: #00ffcc; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }",
    ".asset-card { background: #2a2a35; margin-bottom: 30px; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border-left: 5px solid #00ffcc; }",
    ".asset-title { font-size: 1.2rem; font-weight: bold; margin-top: 0; color: #fff; }",
    ".asset-specs { background: #1f1f2a; padding: 10px; border-radius: 4px; font-size: 0.9rem; margin-bottom: 15px; color: #aaa; }",
    ".asset-specs span { color: #00ffcc; font-weight: bold; }",
    ".asset-prompt { background: #111118; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; margin-bottom: 20px; border: 1px solid #333; }",
    ".gallery { display: flex; flex-wrap: wrap; gap: 20px; }",
    ".image-container { background: #222; padding: 10px; border-radius: 8px; outline: 1px solid #444; width: 320px; text-align: center; }",
    ".image-container h4 { margin: 0 0 10px 0; font-size: 0.8rem; color: #888; word-wrap: break-word; }",
    ".image-container img { max-width: 100%; max-height: 300px; border-radius: 4px; background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAhgg+v///0H6GRhgAsQbRTUQXcIQQwEANo0CAXU+UygAAAAASUVORK5CYII=') repeat; }",
    "</style>",
    "</head>",
    "<body>",
    "<h1>AI-ARCADE Poker UI Asset Pipeline</h1>",
    "<p style='text-align: center; max-width: 800px; margin: 0 auto 30px auto; color: #aaa;'>This gallery shows all 58 canonical assets, their required prompts, and all matching local image candidates found across your <b>/assets/poker/</b> folders and recent AI generation folders.</p>"
]

with open(MANIFEST_PATH, "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        filename = row['filename']
        asset_code = filename.replace('.png', '')
        prompt = row['prompt']
        w = row['expectedWidth']
        h = row['expectedHeight']

        needs_alpha = not ("background" in prompt.lower() and "full-bleed" not in prompt.lower())
        alpha_text = "Transparent (Requires Alpha)" if needs_alpha else "Full-Bleed Background (No Alpha)"

        full_prompt = GLOBAL_THEME + prompt

        # Find candidates
        candidates = []

        # Look in DIR1 (Originals)
        for cand in glob.glob(os.path.join(DIR1, f"{asset_code}*.*")):
            if os.path.isfile(cand) and cand.lower().endswith(('.png', '.jpg', '.jpeg')):
                candidates.append(("Original Asset Folder", cand))

        # Look in DIR2 (Incoming / Processed)
        for cand in glob.glob(os.path.join(DIR2, f"{asset_code}*.*")):
            if os.path.isfile(cand) and cand.lower().endswith(('.png', '.jpg', '.jpeg')):
                candidates.append(("Incoming / Sized Folder", cand))

        # Look in DIR3 (Gemini raw generations)
        for cand in glob.glob(os.path.join(DIR3, "*.png")):
            b = os.path.basename(cand)
            if b.startswith(asset_code):
                candidates.append(("AI Generation Folder", cand))
            # Test chip exception
            if asset_code == "pkr_chip_denom_25_idle_v01" and "test_chip" in b:
                candidates.append(("AI Generation Folder", cand))

        html_content.append("<div class='asset-card'>")
        html_content.append(f"<div class='asset-title'>{filename}</div>")
        html_content.append(f"<div class='asset-specs'>Dimensions: <span>{w}x{h} px</span> &bull; Alpha: <span>{alpha_text}</span></div>")
        html_content.append(f"<div class='asset-prompt'>{full_prompt}</div>")

        if len(candidates) > 0:
            html_content.append("<div class='gallery'>")
            for source, path in candidates:
                html_content.append(f"<div class='image-container'>")
                html_content.append(f"<h4>{source}<br/>{os.path.basename(path)}</h4>")
                html_content.append(f"<img src='file://{path}' alt='candidate img'>")
                html_content.append("</div>")
            html_content.append("</div>")
        else:
            html_content.append("<div style='color: #ff5555; padding: 10px; border: 1px dashed #ff5555; display: inline-block;'>No matching candidate images found locally. Needs generation.</div>")

        html_content.append("</div>")

html_content.append("</body></html>")

with open(OUTPUT_HTML, "w") as f:
    f.write("\n".join(html_content))

print(f"Generated gallery HTML at: {OUTPUT_HTML}")
