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

files = [
    '/Users/<owner>/.gemini/antigravity/conversations/c5b48a4f-c38d-4731-91ae-5404f9ddc217.pb',
    '/Users/<owner>/.gemini/antigravity/conversations/274bfb08-df95-4742-8a16-ba64901e2a73.34a1f98c-ca19-458c-9f59-c4dfbe67fdb9.tmp',
    '/Users/<owner>/.gemini/antigravity/conversations/8ebfa1e1-40e2-42bd-9861-999566c5f756.42a60dd5-c812-4a2d-baee-dc0ede69c4e5.tmp',
    '/Users/<owner>/.gemini/antigravity/conversations/636ecdcc-9b45-485d-82f6-65982832912d.8ee5cbec-708a-4476-8854-40ee230e6f60.tmp'
]
for f in files:
    if os.path.exists(f):
        check_file(f)
