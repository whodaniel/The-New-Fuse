import re

with open('packages/tnf-cli/src/slashCommands.ts', 'r') as f:
    content = f.read()

new_func = """export function parseSlashCommands(input: string): ParsedSlashCommand[] {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return [];
  
  const tokens = trimmed.split(/\\s+/).filter(Boolean);
  const commands: ParsedSlashCommand[] = [];
  let currentCmd: ParsedSlashCommand | null = null;
  
  for (const token of tokens) {
    if (token.startsWith('/') && token.indexOf('/', 1) === -1) {
      const rawName = token.slice(1);
      if (rawName) {
        currentCmd = {
          rawName,
          name: normalizeSlashName(rawName),
          args: [],
        };
        commands.push(currentCmd);
      } else if (currentCmd) {
        currentCmd.args.push(token);
      }
    } else if (currentCmd) {
      currentCmd.args.push(token);
    }
  }
  
  return commands;
}

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
"""

content = content.replace("export function parseSlashCommand(input: string): ParsedSlashCommand | null {\n", new_func)
with open('packages/tnf-cli/src/slashCommands.ts', 'w') as f:
    f.write(content)
