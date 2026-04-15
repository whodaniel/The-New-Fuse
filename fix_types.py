import re

filepath = 'packages/database/src/drizzle/types.ts'
with open(filepath, 'r') as f:
    content = f.read()

import_addition = """import { workspaceBookmarks, workspaceDomains } from './schema';
"""
if "workspaceBookmarks" not in content.split("\n")[0:20] and "import { workspaceBookmarks" not in content:
    content = content.replace("import { InferInsertModel, InferSelectModel } from 'drizzle-orm';", "import { InferInsertModel, InferSelectModel } from 'drizzle-orm';\n" + import_addition)

with open(filepath, 'w') as f:
    f.write(content)
