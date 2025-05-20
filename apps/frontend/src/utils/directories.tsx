export function middleTruncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  
  const ellipsis = "...";
  const charsToShow = maxLength - ellipsis.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  
  return str.slice(0, frontChars) + ellipsis + str.slice(str.length - backChars);
}

export function truncateFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length <= 1) return filename;
  return parts.slice(0, -1).join(".");
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length <= 1) return "";
  return parts[parts.length - 1].toLowerCase();
}

export function isImageByExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
}

export function isVideoByExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["mp4", "webm", "ogg", "mov", "avi"].includes(ext);
}

export function isAudioByExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["mp3", "wav", "ogg", "m4a", "aac"].includes(ext);
}

export function isPDFByExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ext === "pdf";
}

export function isTextByExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return [
    "txt", "md", "json", "csv", "yml", "yaml", "xml",
    "html", "htm", "css", "js", "ts", "jsx", "tsx"
  ].includes(ext);
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function getFileName(path: string): string {
  return normalizePath(path).split('/').pop() || '';
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

export function getFileNameWithoutExtension(fileName: string): string {
  const extension = getFileExtension(fileName);
  return extension ? fileName.slice(0, -(extension.length + 1)) : fileName;
}

export function getDirectoryPath(path: string): string {
  const normalized = normalizePath(path);
  return normalized.substring(0, normalized.lastIndexOf('/')) || '/';
}

export function joinPaths(...paths: string[]): string {
  return normalizePath(paths.map(path => path.replace(/^\/|\/$/g, '')).join('/'));
}

export function isSubPath(parent: string, child: string): boolean {
  const normalizedParent = normalizePath(parent);
  const normalizedChild = normalizePath(child);
  return normalizedChild.startsWith(normalizedParent);
}

export function getRelativePath(from: string, to: string): string {
  const fromParts = normalizePath(from).split('/');
  const toParts = normalizePath(to).split('/');

  while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }

  return [...Array(fromParts.length).fill('..'), ...toParts].join('/');
}

export function getPathDepth(path: string): number {
  return normalizePath(path).split('/').filter(Boolean).length;
}

export function getCommonPath(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) return getDirectoryPath(paths[0]);

  const parts = paths.map(path => normalizePath(path).split('/'));
  const minLength = Math.min(...parts.map(p => p.length));

  let commonParts: string[] = [];
  for (let i = 0; i < minLength; i++) {
    const part = parts[0][i];
    if (parts.every(p => p[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  return commonParts.join('/');
}

export function isValidFileName(fileName: string): boolean {
  // Check for invalid characters in file names
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
  return !invalidChars.test(fileName) && fileName.trim() === fileName && fileName !== '.' && fileName !== '..';
}

export function sanitizeFileName(fileName: string): string {
  // Replace invalid characters with underscores
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^\.+/, '_')
    .trim();
}

export function parsePathParts(path: string): {
  root: string;
  dir: string;
  name: string;
  ext: string;
} {
  const normalized = normalizePath(path);
  const fileName = getFileName(normalized);
  const ext = getFileExtension(fileName);
  const name = getFileNameWithoutExtension(fileName);
  const dir = getDirectoryPath(normalized);
  const root = dir.split('/')[0] || '/';

  return {
    root,
    dir,
    name,
    ext
  };
}