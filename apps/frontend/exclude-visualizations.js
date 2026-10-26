// Vite plugin to prune oversized assets (>24MB) from build output for Cloudflare Pages compatibility.
// Cloudflare Pages has a strict 25 MiB file size limit; pruning oversized files allows all
// other visualization surfaces to be safely bundled and deployed without dropping the entire folder.
export function excludeVisualizations() {
  return {
    name: 'exclude-visualizations',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      const fs = await import('fs/promises');
      const path = await import('path');
      const distDir = path.resolve('dist');

      async function pruneOversized(dir) {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await pruneOversized(fullPath);
            } else if (entry.isFile()) {
              const stat = await fs.stat(fullPath);
              if (stat.size > 24 * 1024 * 1024) {
                await fs.unlink(fullPath);
                console.log(
                  `[exclude-visualizations] Pruned oversized asset: ${fullPath} (${(stat.size / (1024 * 1024)).toFixed(1)}MB > 24MB limit)`
                );
              }
            }
          }
        } catch (_e) {
          // Folder or file may not exist, that's fine
        }
      }

      await pruneOversized(distDir);
    },
  };
}
