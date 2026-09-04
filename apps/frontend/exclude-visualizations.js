// Vite plugin to exclude visualizations folder from build output
export function excludeVisualizations() {
  return {
    name: 'exclude-visualizations',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      const fs = await import('fs/promises');
      const path = await import('path');
      const visualizationsDir = path.resolve('dist/visualizations');
      try {
        await fs.rm(visualizationsDir, { recursive: true, force: true });
        console.log('[exclude-visualizations] Removed visualizations folder from dist');
      } catch (e) {
        // Folder might not exist, that's fine
      }
    },
  };
}
