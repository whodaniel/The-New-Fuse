import re

with open('apps/external/gemini-cli-source/packages/core/src/tools/memoryTool.ts', 'r') as f:
    content = f.read()

# I am replacing all literal \\n with actual \n characters in string templates
content = content.replace("\\\\n", "\\n")
content = content.replace("\\\\s", "\\s")

with open('apps/external/gemini-cli-source/packages/core/src/tools/memoryTool.ts', 'w') as f:
    f.write(content)
