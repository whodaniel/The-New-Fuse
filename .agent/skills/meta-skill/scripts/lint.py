"""Parse untrusted Python without importing or executing it."""
import ast, json, re, sys, tomllib
source = json.load(sys.stdin)['source']
blocks = re.findall(r'^# /// script\n((?:#.*\n)*)# ///\s*$', source, re.M)
if len(blocks) != 1:
    raise ValueError('Exactly one PEP 723 script block required')
metadata = tomllib.loads('\n'.join(line[2:] if line.startswith('# ') else line[1:] for line in blocks[0].splitlines()))
if metadata != {'requires-python': '>=3.11', 'dependencies': []}:
    raise ValueError('v1 requires Python >=3.11 with no third-party dependencies')
tree = ast.parse(source)
# This is lint, not a security boundary. Containers enforce isolation.
for node in ast.walk(tree):
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in {'input', 'eval', 'exec', 'compile', '__import__'}:
        raise ValueError('Interactive/dynamic execution primitive is outside v1 policy')
print(json.dumps({'ok': True, 'python': sys.version.split()[0], 'checks': ['ast', 'pep723', 'noninteractive-static-policy']}))
