export function stripJsoncComments(content: string): string {
  let result = '';
  let inString = false;
  let escape = false;
  let i = 0;
  while (i < content.length) {
    const ch = content[i];
    if (escape) {
      result += ch;
      escape = false;
      i++;
      continue;
    }
    if (ch === '\\' && inString) {
      result += ch;
      escape = true;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      i++;
      continue;
    }
    if (!inString && ch === '/' && i + 1 < content.length) {
      if (content[i + 1] === '/') {
        while (i < content.length && content[i] !== '\n') i++;
        continue;
      }
      if (content[i + 1] === '*') {
        i += 2;
        while (i + 1 < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
    }
    result += ch;
    i++;
  }
  return result;
}
