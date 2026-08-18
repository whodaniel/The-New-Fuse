#!/usr/bin/env node
/**
 * Validate TNF agent definitions:
 * 1. All referenced skills exist in .agent/skills/
 * 2. No duplicate slash command names
 */

const { readFileSync, existsSync, readdirSync } = require('fs');
const { join } = require('path');

const REPO_ROOT = join(__dirname, '..');

let errors = 0;

function getSkillDirs(skillsDir) {
  try {
    return readdirSync(skillsDir).filter(f => {
      return !f.startsWith('.') && f !== 'node_modules';
    });
  } catch {
    return [];
  }
}

function extractSkillsFromMarkdown(content) {
  const skills = [];
  const skillsSection = content.match(/^skills:\s*\n([\s\S]*?)(?=^---|\n\w)/m);
  if (skillsSection) {
    const matches = skillsSection[1].matchAll(/^\s+-\s+(\S+)/gm);
    for (const match of matches) {
      skills.push(match[1]);
    }
  }
  return skills;
}

function extractSlashCommands(content) {
  const commands = [];
  const stdSection = content.match(/STANDARD_SLASH_COMMANDS.*?=\s*\[([\s\S]*?)\];/);
  const tnfSection = content.match(/TNF_SLASH_COMMANDS.*?=\s*\[([\s\S]*?)\];/);

  const extractNames = (block) => {
    if (!block) return;
    const matches = block.matchAll(/name:\s*['"](\S+)['"]/g);
    for (const match of matches) commands.push(match[1]);
  };

  extractNames(stdSection && stdSection[1]);
  extractNames(tnfSection && tnfSection[1]);
  return commands;
}

console.log('🔍 Validating TNF agent definitions...\n');

// Check skill existence
const agentFiles = [
  join(REPO_ROOT, '.agent/agents/tnf-cli.md'),
  join(REPO_ROOT, '.agent/fleet/users/agents/tnf-cli.md'),
];

const skillsDir = join(REPO_ROOT, '.agent/skills');
const existingSkills = getSkillDirs(skillsDir);

console.log('📦 Checking skill references...');
for (const file of agentFiles) {
  if (!existsSync(file)) continue;

  const content = readFileSync(file, 'utf-8');
  const skills = extractSkillsFromMarkdown(content);
  const agentName = file.includes('/fleet/users/agents/')
    ? file.split('/fleet/users/agents/')[1]
    : file.split('/agents/')[1];

  for (const skill of skills) {
    if (!existingSkills.includes(skill)) {
      console.error(`  ❌ ${agentName}: skill "${skill}" does not exist`);
      errors++;
    }
  }

  if (skills.length > 0) {
    console.log(`  ✅ ${agentName}: ${skills.length} skills, all valid`);
  }
}

console.log('\n📝 Checking slash command uniqueness...');
const slashCommandsFile = join(REPO_ROOT, 'packages/tnf-cli/src/slashCommands.ts');
if (existsSync(slashCommandsFile)) {
  const content = readFileSync(slashCommandsFile, 'utf-8');
  const commands = extractSlashCommands(content);
  const duplicates = commands.filter((c, i) => commands.indexOf(c) !== i);

  if (duplicates.length > 0) {
    console.error(`  ❌ Duplicate slash commands: ${[...new Set(duplicates)].join(', ')}`);
    errors++;
  } else {
    console.log(`  ✅ ${commands.length} slash commands, no duplicates`);
  }
}

console.log('\n' + (errors === 0 ? '✅ All validations passed!' : `❌ ${errors} validation(s) failed`));
process.exit(errors);