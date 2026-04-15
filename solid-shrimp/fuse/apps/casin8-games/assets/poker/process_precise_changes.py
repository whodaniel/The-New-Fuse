import os
import csv
from PIL import Image, ImageMath, ImageFilter, ImageDraw, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

def process_image(src_path, dst_path, tgt_w, tgt_h, filename):
    try:
        if not os.path.exists(src_path):
            print(f"Skipping {filename}: Source missing")
            return False

        with Image.open(src_path) as im:
            img = im.convert("RGBA")
            img.load()
        w, h = img.size

        # Crop center if it's a wide AI generation (e.g. 2752x1536) and target is 1:1
        if w > h and tgt_w == tgt_h:
            left = (w - h) // 2
            right = left + h
            img = img.crop((left, 0, right, h))
        # Crop center if it's a tall AI generation and target is wide
        elif h > w and tgt_w > tgt_h:
            top = (h - w) // 2
            bottom = top + w
            img = img.crop((0, top, w, bottom))

        # Resize to exact target
        img = img.resize((tgt_w, tgt_h), Image.Resampling.LANCZOS)

        # Determine if it needs alpha based on filename heuristics
        # Backgrounds generally don't need transparent masking, props do
        needs_alpha = not any(bg_str in filename for bg_str in ["_bg_", "_table_felt_"])

        if needs_alpha:
            gray = img.convert('L')
            # Soft mask: very dark background -> transparent
            mask = gray.point(lambda p: 0 if p < 25 else (255 if p > 70 else int((p-25)*255/45)))

            # Fast radial mask: draw small, blur small, scale up
            small_w, small_h = 200, 200
            radial_mask = Image.new('L', (small_w, small_h), 0)
            draw = ImageDraw.Draw(radial_mask)
            margin = int(small_w * 0.05)
            draw.ellipse((margin, margin, small_w-margin, small_h-margin), fill=255)
            radial_mask = radial_mask.filter(ImageFilter.GaussianBlur(radius=5))
            radial_mask = radial_mask.resize((tgt_w, tgt_h), Image.Resampling.LANCZOS)

            # Combine image alpha with radial mask using unsafe_eval for Pillow 12+ compat
            # 'a' is color mask, 'b' is radial mask
            final_mask = ImageMath.unsafe_eval("convert(min(a, b), 'L')", a=mask, b=radial_mask)
            img.putalpha(final_mask)

        temp_dst = dst_path + ".tmp.png"
        img.save(temp_dst, "PNG")
        os.replace(temp_dst, dst_path)
        print(f"Processed: {filename}")
        return True
    except Exception as e:
        print(f"Failed {filename}: {e}")
        return False

def main():
    docs_dir = "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/docs"
    assets_dir = "/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/assets/poker"
    manifest_csv = os.path.join(docs_dir, "NANOBANANA_POKER_GRAPHICS_MANIFEST.csv")
    need_edit_csv = os.path.join(docs_dir, "POKER_ASSETS_NEED_EDIT_OR_REGEN.csv")

    # Read the ones needing edit
    needs_edit = set()
    with open(need_edit_csv, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            needs_edit.add(row['canonicalFilename'])

    # Process from manifest
    processed_count = 0
    with open(manifest_csv, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            filename = row['filename']
            if filename in needs_edit:
                width = int(row['expectedWidth'])
                height = int(row['expectedHeight'])

                # The original source files are likely in the assets_dir, currently mis-formatted
                src_path = os.path.join(assets_dir, filename)
                # Overwrite them with the true, corrected PNG!
                success = process_image(src_path, src_path, width, height, filename)
                if success:
                    processed_count += 1

    print(f"\nSuccessfully corrected {processed_count} existing assets.")

if __name__ == "__main__":
    main()
