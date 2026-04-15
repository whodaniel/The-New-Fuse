import re
import os

filepath = 'packages/database/src/drizzle/types.ts'
with open(filepath, 'r') as f:
    content = f.read()

types_to_add = """
export type WorkspaceBookmark = InferSelectModel<typeof workspaceBookmarks>;
export type NewWorkspaceBookmark = InferInsertModel<typeof workspaceBookmarks>;

export type WorkspaceDomain = InferSelectModel<typeof workspaceDomains>;
export type NewWorkspaceDomain = InferInsertModel<typeof workspaceDomains>;
"""

if "WorkspaceBookmark" not in content:
    content = content.replace("export type NewWorkspace = InferInsertModel<typeof workspaces>;", f"export type NewWorkspace = InferInsertModel<typeof workspaces>;\n{types_to_add}")

    with open(filepath, 'w') as f:
        f.write(content)
