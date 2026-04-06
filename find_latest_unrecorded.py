import os, glob

d = '/Users/<owner>/.gemini/antigravity/conversations/'
files = glob.glob(d + '*.pb') + glob.glob(d + '*.tmp')
files.sort(key=os.path.getmtime, reverse=True)

# These are the ones shown in the UI "recent" plus `274b` which is current.
ignore = [
    '274bfb08', 'b5b868a0', '7bcef52b', '8a1a15cb', '0ab28725',
    '6f9bc633', '9e809a55', 'd6e6fde3', '5b48aded', '76d70554'
]

unrecorded = [f for f in files if not any(i in f for i in ignore)]

if unrecorded:
    target = unrecorded[0]
    print(f"Targeting: {target}")
    # decode raw and grep for user text or just long strings
    cmd = f'protoc --decode_raw < "{target}" > tmp_decode_output.txt'
    os.system(cmd)
    print("Decoded. Now looking for user prompts...")
else:
    print("No unrecorded files found.")
