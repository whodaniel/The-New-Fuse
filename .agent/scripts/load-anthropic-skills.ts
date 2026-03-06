#!/usr/bin/env node
/**
 * Load Anthropic Skills into The New Fuse
 * Parses SKILL.md files and creates skill resources
 */

import * as fs from 'fs';
import { glob } from 'glob';
import * as path from 'path';

interface SkillMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];
  dependencies?: string[];
}

interface SkillDefinition {
  metadata: SkillMetadata;
  content: string;
  path: string;
}

const ANTHROPIC_SKILLS_DIR = '/path/to/.claude/skills/skills';
const TNF_SKILLS_DIR =
  '/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/skills/anthropic';

function parseSkillMd(filePath: string): SkillDefinition | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let metadata: SkillMetadata = { name: path.basename(path.dirname(filePath)) };

    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      // Simple YAML parsing
      const lines = yaml.split('\n');
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (key && value) {
          if (key === 'name') metadata.name = value.replace(/['"]/g, '');
          if (key === 'description') metadata.description = value.replace(/['"]/g, '');
          if (key === 'version') metadata.version = value.replace(/['"]/g, '');
          if (key === 'author') metadata.author = value.replace(/['"]/g, '');
        }
      }
    }

    return {
      metadata,
      content,
      path: filePath,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

async function loadAnthropicSkills() {
  console.log('🔍 Scanning for Anthropic skills...');

  // Find all SKILL.md files
  const skillFiles = await glob(`${ANTHROPIC_SKILLS_DIR}/*/SKILL.md`);
  console.log(`📚 Found ${skillFiles.length} skills`);

  // Create TNF skills directory if it doesn't exist
  if (!fs.existsSync(TNF_SKILLS_DIR)) {
    fs.mkdirSync(TNF_SKILLS_DIR, { recursive: true });
  }

  const skills: SkillDefinition[] = [];

  // Parse each skill
  for (const skillFile of skillFiles) {
    const skill = parseSkillMd(skillFile);
    if (skill) {
      skills.push(skill);
      console.log(`  ✓ ${skill.metadata.name}`);

      // Copy skill to TNF skills directory
      const skillName = skill.metadata.name;
      const targetDir = path.join(TNF_SKILLS_DIR, skillName);
      const sourceDir = path.dirname(skillFile);

      // Create target directory
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy all files from source directory
      const files = fs.readdirSync(sourceDir);
      for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        if (fs.statSync(sourcePath).isFile()) {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
    }
  }

  // Generate skills manifest
  const manifest = {
    version: '1.0.0',
    source: 'anthropic/skills',
    loadedAt: new Date().toISOString(),
    skills: skills.map((s) => ({
      name: s.metadata.name,
      description: s.metadata.description,
      version: s.metadata.version,
      path: path.relative(TNF_SKILLS_DIR, path.join(TNF_SKILLS_DIR, s.metadata.name)),
    })),
  };

  fs.writeFileSync(path.join(TNF_SKILLS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Loaded ${skills.length} Anthropic skills`);
  console.log(`📦 Skills installed to: ${TNF_SKILLS_DIR}`);
  console.log(`📋 Manifest created: ${path.join(TNF_SKILLS_DIR, 'manifest.json')}`);

  return skills;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadAnthropicSkills().catch(console.error);
}

export { loadAnthropicSkills, parseSkillMd };
