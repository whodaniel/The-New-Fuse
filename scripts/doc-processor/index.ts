import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Living Documentation Processor
 * Stage 1 & 2: Discovery & Classification
 * Integrates with pgvector for Hybrid Knowledge Graphs
 */

const CONFIG = {
  docsDir: path.resolve(__dirname, '../../docs'),
  outputDir: path.resolve(__dirname, '../../.documentation-system'),
  manifestFile: 'manifest.json',
  extensions: ['.md', '.txt', '.mdx'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build']
};

class DocProcessor {
  async run() {
    console.log('🚀 Starting Living Documentation Processor...');
    
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const manifest = {
      metadata: {
        generated: new Date().toISOString(),
        total_files: 0,
        by_category: {} as Record<string, number>
      },
      files: [] as any[]
    };

    const files = this.walkDir(CONFIG.docsDir);
    
    for (const filePath of files) {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(path.resolve(__dirname, '../..'), filePath);
      
      const classification = this.classify(relativePath, content);
      
      const fileEntry = {
        path: relativePath,
        name: path.basename(filePath),
        size: stats.size,
        hash: crypto.createHash('sha256').update(content).digest('hex'),
        modified: stats.mtime.toISOString(),
        category: classification.category,
        subcategory: classification.subcategory,
        priority: classification.priority,
        tags: classification.tags,
        // pgvector metadata
        vector_status: 'pending',
        collection: 'tnf_docs_v1'
      };

      manifest.files.push(fileEntry);
      manifest.metadata.total_files++;
      manifest.metadata.by_category[fileEntry.category] = (manifest.metadata.by_category[fileEntry.category] || 0) + 1;
    }

    fs.writeFileSync(
      path.join(CONFIG.outputDir, CONFIG.manifestFile),
      JSON.stringify(manifest, null, 2)
    );

    console.log(`✅ Processed ${manifest.metadata.total_files} files.`);
    console.log(`📂 Manifest saved to: ${path.join(CONFIG.outputDir, CONFIG.manifestFile)}`);
  }

  walkDir(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.resolve(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(path.basename(file))) {
          results = results.concat(this.walkDir(file));
        }
      } else {
        if (CONFIG.extensions.includes(path.extname(file))) {
          results.push(file);
        }
      }
    });
    return results;
  }

  classify(relPath: string, content: string) {
    const lowerPath = relPath.toLowerCase();
    let category = 'GENERAL';
    let subcategory = 'Unclassified';
    let priority: 'P0' | 'P1' | 'P2' = 'P2';
    const tags: string[] = [];

    // P0 Identification
    if (lowerPath.includes('manifesto') || lowerPath.includes('protocol') || lowerPath.includes('architecture')) {
      priority = 'P0';
      category = 'CORE';
      tags.push('foundational');
    }

    // Category Mapping
    if (lowerPath.includes('agent')) {
      category = 'AGENTIC';
      subcategory = 'Orchestration';
      tags.push('agent');
    } else if (lowerPath.includes('ui') || lowerPath.includes('ux') || lowerPath.includes('design')) {
      category = 'FRONTEND';
      subcategory = 'Design System';
    } else if (lowerPath.includes('api') || lowerPath.includes('gateway')) {
      category = 'BACKEND';
      subcategory = 'Infrastructure';
    }

    // Extract Tags from Headings
    const headings = content.match(/^#+\s+(.*)$/gm);
    if (headings) {
      headings.slice(0, 5).forEach(h => {
        const cleanH = h.replace(/#+\s+/, '').toLowerCase();
        if (cleanH.length > 3 && cleanH.length < 20) tags.push(cleanH);
      });
    }

    return { category, subcategory, priority, tags: [...new Set(tags)] };
  }
}

const processor = new DocProcessor();
processor.run().catch(console.error);
