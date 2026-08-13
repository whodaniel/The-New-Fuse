import os
import re
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))

HTML_FILE = os.path.join(KB_ROOT, "video-library", "ai_video_library.html")
TRANSCRIPT_DIRS = [
    os.path.join(KB_ROOT, "transcripts"),
    os.path.join(KB_ROOT, "video-transcripts"),
]

def parse_library():
    print(f"Parsing library: {HTML_FILE}")
    with open(HTML_FILE, "r") as f:
        content = f.read()
    
    # Regex to match <tr><td class="index-col">N</td><td class="title-col"><a href="URL">Title</a></td>
    # Using a more flexible regex for class names and whitespace
    row_pattern = re.compile(r'<tr>\s*<td[^>]*index-col[^>]*>\s*(\d+)\s*</td>\s*<td[^>]*title-col[^>]*>\s*<a\s+href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL)
    
    videos = []
    for match in row_pattern.finditer(content):
        index = int(match.group(1))
        url = match.group(2)
        title = match.group(3).strip()
        videos.append({
            "index": index,
            "url": url,
            "title": title
        })
    
    print(f"Found {len(videos)} videos in library.")
    return sorted(videos, key=lambda x: x['index'])

def find_transcripts():
    transcripts = {}
    for d in TRANSCRIPT_DIRS:
        if not os.path.exists(d):
            continue
        print(f"Scanning directory: {d}")
        for f in os.listdir(d):
            if f.endswith(".txt"):
                # Try to extract index
                # Formats: transcript_N_... or N_...
                match = re.search(r'(?:transcript_)?(\d+)_', f)
                if match:
                    index = int(match.group(1))
                    transcripts[index] = os.path.join(d, f)
    
    print(f"Found {len(transcripts)} transcripts.")
    return transcripts

def main():
    videos = parse_library()
    transcripts = find_transcripts()
    
    backlog = []
    for v in videos:
        v['transcript_path'] = transcripts.get(v['index'])
        if v['transcript_path']:
            backlog.append(v)
    
    # Save the backlog to process
    output_file = os.path.join(PROJECT_ROOT, "data", "video_processing_backlog.json")
    with open(output_file, "w") as f:
        json.dump(backlog, f, indent=2)
    
    print(f"Created backlog with {len(backlog)} ready-to-process videos.")
    
    # Also find missing transcripts
    missing = [v for v in videos if not transcripts.get(v['index'])]
    print(f"There are {len(missing)} videos missing transcripts.")
    
    # Special check for AI 2 / AI 3
    ai_2_3 = [v for v in videos if "AI 2" in v['title'] or "AI 3" in v['title']]
    print(f"Found {len(ai_2_3)} videos with 'AI 2' or 'AI 3' in title.")
    for v in ai_2_3:
        status = "✅ Has transcript" if transcripts.get(v['index']) else "❌ Missing transcript"
        print(f"  #{v['index']}: {v['title']} - {status}")

if __name__ == "__main__":
    main()
