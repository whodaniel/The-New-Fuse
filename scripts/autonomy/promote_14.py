import json

path = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-phase7-directive-conversion-ledger.json'
with open(path, 'r') as f:
    d = json.load(f)

items = [x for x in d.get('records', []) if isinstance(x, dict) and x.get('state') == 'blocked' and x.get('blockReason', '') != 'irrelevant-context']

promoted = 0
print(f'Found {len(items)} eligible')
for x in items[:14]:
    x['state'] = 'ready'
    x['blockReason'] = None
    promoted += 1

d['summary']['stateCounts']['ready'] = d['summary']['stateCounts'].get('ready', 0) + promoted
d['summary']['stateCounts']['blocked'] = d['summary']['stateCounts'].get('blocked', 0) - promoted

print(f'Promoted {promoted} directives.')

with open(path, 'w') as f:
    json.dump(d, f, indent=2)
