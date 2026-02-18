import re

filepath = 'apps/frontend/src/ComprehensiveRouter.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Insert Sidebar Redirects & Placeholders
redirects_block = """
              {/* Sidebar Navigation Redirects & Placeholders */}
              <Route path="/overview" element={<Navigate to="/workspace/overview" replace />} />
              <Route path="/skills" element={<Navigate to="/admin/agents/skills" replace />} />
              <Route path="/config" element={<Navigate to="/admin/configuration" replace />} />
              <Route path="/logs" element={<Navigate to="/admin/audit-logs" replace />} />
              
              <Route path="/channels" element={<RequireAuth><LazyPage name="Channels" path="/channels" /></RequireAuth>} />
              <Route path="/instances" element={<RequireAuth><LazyPage name="Instances" path="/instances" /></RequireAuth>} />
              <Route path="/sessions" element={<RequireAuth><LazyPage name="Sessions" path="/sessions" /></RequireAuth>} />
              <Route path="/usage" element={<RequireAuth><LazyPage name="Usage" path="/usage" /></RequireAuth>} />
              <Route path="/cron-jobs" element={<RequireAuth><LazyPage name="Cron Jobs" path="/cron-jobs" /></RequireAuth>} />
              <Route path="/nodes" element={<RequireAuth><LazyPage name="Nodes" path="/nodes" /></RequireAuth>} />
"""

target_marker = "{/* Resources Marketplace */}"
if target_marker in content:
    content = content.replace(target_marker, redirects_block + "\n              " + target_marker)
else:
    print("Could not find insertion point for redirects")

# 2. Protect Workflow Routes
replacements = [
    ('<Route path="/workflows/builder" element={<WorkflowBuilder />} />', '<Route path="/workflows/builder" element={<RequireAuth><WorkflowBuilder /></RequireAuth>} />'),
    ('<Route path="/workflows/executions" element={<WorkflowExecutionPage />} />', '<Route path="/workflows/executions" element={<RequireAuth><WorkflowExecutionPage /></RequireAuth>} />'),
    ('<Route path="/workflows/:id" element={<WorkflowDetailPage />} />', '<Route path="/workflows/:id" element={<RequireAuth><WorkflowDetailPage /></RequireAuth>} />'),
    ('<Route path="/workflows/:id/execution" element={<WorkflowExecutionPage />} />', '<Route path="/workflows/:id/execution" element={<RequireAuth><WorkflowExecutionPage /></RequireAuth>} />'),
    ('<Route path="/workflows/console" element={<ExecutionConsole />} />', '<Route path="/workflows/console" element={<RequireAuth><ExecutionConsole /></RequireAuth>} />'),
    ('<Route path="/workflows/advanced-builder" element={<WorkflowEditorWrapper />} />', '<Route path="/workflows/advanced-builder" element={<RequireAuth><WorkflowEditorWrapper /></RequireAuth>} />'),
    ('<Route path="/workflows/templates" element={<WorkflowTemplatesPage />} />', '<Route path="/workflows/templates" element={<RequireAuth><WorkflowTemplatesPage /></RequireAuth>} />'),
    ('<Route path="/workflows-enhanced" element={<WorkflowsEnhancedPage />} />', '<Route path="/workflows-enhanced" element={<RequireAuth><WorkflowsEnhancedPage /></RequireAuth>} />'),
    ('<Route path="/workflows/detail" element={<WorkflowDetailPage />} />', '<Route path="/workflows/detail" element={<RequireAuth><WorkflowDetailPage /></RequireAuth>} />'),
    ('<Route path="/workflows/execution" element={<WorkflowExecutionPage />} />', '<Route path="/workflows/execution" element={<RequireAuth><WorkflowExecutionPage /></RequireAuth>} />'),
]

for search_str, replace_str in replacements:
    if search_str in content:
        content = content.replace(search_str, replace_str)
    else:
        print(f"Could not find route to protect: {search_str}")

with open(filepath, 'w') as f:
    f.write(content)

print("Finished modifying ComprehensiveRouter.tsx")
