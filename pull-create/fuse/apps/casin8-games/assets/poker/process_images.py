import os
import csv
import glob
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games"
ASSETS_DIR = os.path.join(BASE_DIR, "assets", "poker")
INCOMING_DIR = os.path.join(ASSETS_DIR, "incoming")
DOCS_DIR = os.path.join(BASE_DIR, "docs")
GEMINI_DIR = "/path/to/.gemini/antigravity/brain/10fb84f8-6e8f-41e1-beb4-ba647f63f6ad"

os.makedirs(INCOMING_DIR, exist_ok=True)

def remove_background(img):
    img = img.convert("RGBA")
    datas = img.getdata()

    # Simple heuristic: remove the background color
    # Assuming the top left pixel is the background
    bg_color = datas[0]
    # If the image is very complex, this is rudimentary but it applies alpha channel.
    # We will use a small tolerance
    new_data = []
    for item in datas:
        # Check difference from bg color
        if abs(item[0]-bg_color[0]) < 20 and abs(item[1]-bg_color[1]) < 20 and abs(item[2]-bg_color[2]) < 20:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    return img

def process_image(src_path, target_path, req_w, req_h, transparent, is_fallback=False):
    if not is_fallback and (src_path is None or not os.path.exists(src_path)):
        print(f"Skipping {src_path}, file not found")
        return False

    if is_fallback:
        print(f"Generating synthetic placeholder for {os.path.basename(target_path)}")
        img = Image.new('RGBA' if transparent else 'RGB', (req_w, req_h), (30, 30, 40, 0 if transparent else 255))
        d = ImageDraw.Draw(img)
        # draw a border and some text
        d.rectangle([50, 50, req_w-50, req_h-50], outline=(0,255,100,255), width=10)
        try:
            # We don't have a specific font, default will be small but it's just a placeholder
            d.text((100, req_h//2), os.path.basename(target_path), fill=(255,255,255,255))
        except:
            pass
    else:
        print(f"Processing {src_path} -> {os.path.basename(target_path)}")
        img = Image.open(src_path)
        img = img.resize((req_w, req_h), Image.Resampling.LANCZOS)

        if transparent:
            img = remove_background(img)
        else:
            img = img.convert("RGB")

    # Save format MUST be True PNG.
    img.save(target_path, "PNG")
    return True

def run():
    # 1. Process EXISTING assets
    existing_csv = os.path.join(DOCS_DIR, "POKER_ASSETS_NEED_EDIT_OR_REGEN.csv")
    with open(existing_csv, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            asset_code = row['assetCode']
            req_w = int(row['requiredWidth'])
            req_h = int(row['requiredHeight'])
            canonical = row['canonicalFilename']
            prompt = row['basePrompt']

            # They expect transparent except for "shell/scene" background assets which are full bleed
            needs_transparent = not ("background" in prompt.lower() and "full-bleed" not in prompt.lower())

            # The original existing files are in ASSETS_DIR
            src = os.path.join(ASSETS_DIR, canonical)
            dst = os.path.join(INCOMING_DIR, canonical)

            process_image(src, dst, req_w, req_h, needs_transparent)

    # 2. Process MISSING assets
    missing_csv = os.path.join(DOCS_DIR, "POKER_ASSETS_STILL_MISSING.csv")

    # Gather everything in GEMINI_DIR matching *.png
    gemini_files = glob.glob(os.path.join(GEMINI_DIR, "*.png"))

    with open(missing_csv, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            asset_code = row['assetCode']
            req_w = int(row['requiredWidth'])
            req_h = int(row['requiredHeight'])
            canonical = row['canonicalFilename']
            prompt = row['basePrompt']

            needs_transparent = not ("background" in prompt.lower() and "full-bleed" not in prompt.lower())
            dst = os.path.join(INCOMING_DIR, canonical)

            # Find the generated file if it exists
            # We look for a file starting with assetCode or 'test_chip'
            match = None
            for gf in gemini_files:
                b = os.path.basename(gf)
                if b.startswith(asset_code):
                    match = gf
                    break
                # Special hack for our test_chip which corresponded to denom_25
                if asset_code == "pkr_chip_denom_25_idle_v01" and "test_chip" in b:
                    match = gf
                    break

            if match:
                process_image(match, dst, req_w, req_h, needs_transparent)
            else:
                # generate synthetic fallback
                process_image(None, dst, req_w, req_h, needs_transparent, is_fallback=True)

if __name__ == "__main__":
    run()
