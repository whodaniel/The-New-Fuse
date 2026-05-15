import sys, os, zlib, gzip, re

def check_file(path):
    print("Checking", path)
    with open(path, 'rb') as f:
        data = f.read()
    try:
        data = zlib.decompress(data)
    except:
        try:
            data = gzip.decompress(data)
        except:
            pass
    s = data.decode('utf-8', 'ignore')
    
    # Try finding exact prompts
    prompts = re.findall(r'<USER_REQUEST>(.*?)</USER_REQUEST>', s, re.DOTALL)
    if prompts:
        for i, p in enumerate(prompts[-5:]):
            print(f"--- Prompt {i+1} ---:\n{p.strip()[:500]}\n")
    else:
        # Just grab continuous uppercase tags or user-like things
        msgs = re.findall(r'"user",\s*"content":\s*"(.*?)"', s)
        if msgs:
            for i, m in enumerate(msgs[-5:]):
                print(f"--- Msg {i+1} ---:\n{m[:500]}\n")
        else:
            print("No simple matches found.")

conversations_dir = os.path.expanduser(
    os.getenv("TNF_GEMINI_CONVERSATIONS_DIR", "~/.gemini/antigravity/conversations")
)
files = []
if os.path.isdir(conversations_dir):
    candidates = sorted(os.listdir(conversations_dir))
    for name in candidates[:20]:
        if name.endswith(".pb") or name.endswith(".tmp"):
            files.append(os.path.join(conversations_dir, name))

for f in files:
    if os.path.exists(f):
        check_file(f)
