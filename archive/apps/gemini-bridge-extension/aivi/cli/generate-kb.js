#!/usr/bin/env node

/**
 * Generate Consolidated Knowledge Base
 *
 * Merges all video reports into organized knowledge base
 *
 * Usage:
 *   node cli/generate-kb.js
 */

const fs = require('fs');
const path = require('path');

const config = require('../lib/config');

const REPORTS_DIR = config.reportsDir;
const OUTPUT_DIR = path.join(path.dirname(REPORTS_DIR), 'knowledge-base');

const TOPIC_CATEGORIES = {
  'LLMs & Transformers': ['llm', 'transformer', 'gpt', 'claude', 'gemini', 'language model'],
  'RAG & Vector DBs': [
    'rag',
    'retrieval',
    'vector',
    'embedding',
    'pinecone',
    'weaviate',
    'chromadb',
  ],
  'Agent Frameworks': ['agent', 'autonomous', 'langchain', 'crewai', 'autogen', 'orchestration'],
  'MCP & Protocols': ['mcp', 'protocol', 'model context protocol', 'a2a'],
  'Tools & APIs': ['api', 'tool', 'integration', 'sdk', 'library'],
  Implementation: ['implementation', 'deployment', 'production', 'scaling'],
  Research: ['paper', 'research', 'study', 'benchmark'],
  Applications: ['application', 'use case', 'chatbot', 'assistant'],
};

function loadReports() {
  console.log('📂 Loading reports...\n');
  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
  const reports = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8');
      const lines = content.split('\n');
      const title = lines[0].replace('# ', '').trim();
      const videoIdMatch = content.match(/\*\*Video ID:\*\*\s*(\S+)/);
      const urlMatch = content.match(/\*\*URL:\*\*\s*(\S+)/);
      const indexMatch = content.match(/\*\*Index:\*\*\s*(\d+)/);
      const analysisMatch = content.match(/## AI Analysis\s*\n([\s\S]*?)(?=\n## |---|$)/);

      let parsedAnalysis = null;
      try {
        const jsonMatch =
          analysisMatch?.[1].match(/```json\s*\n([\s\S]*?)\n```/) ||
          analysisMatch?.[1].match(/\{[\s\S]*\}/);
        if (jsonMatch) parsedAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch {}

      reports.push({
        file,
        title,
        videoId: videoIdMatch?.[1] || '',
        url: urlMatch?.[1] || '',
        index: parseInt(indexMatch?.[1] || 0),
        content,
        analysis: analysisMatch?.[1] || '',
        parsedAnalysis,
        category: categorizeContent(title + ' ' + (analysisMatch?.[1] || '')),
      });
    } catch (e) {}
  }

  console.log(`   ✅ Loaded ${reports.length} reports\n`);
  return reports;
}

function categorizeContent(text) {
  const lowerText = text.toLowerCase();
  const categories = [];
  for (const [category, keywords] of Object.entries(TOPIC_CATEGORIES)) {
    if (keywords.some((kw) => lowerText.includes(kw))) categories.push(category);
  }
  return categories.length > 0 ? categories : ['General'];
}

function extractKeyConcepts(reports) {
  console.log('🧠 Extracting concepts...\n');
  const concepts = new Map();

  for (const report of reports) {
    if (report.parsedAnalysis?.aiConcepts) {
      for (const concept of report.parsedAnalysis.aiConcepts) {
        if (!concepts.has(concept)) concepts.set(concept, { concept, sources: [], count: 0 });
        const entry = concepts.get(concept);
        entry.sources.push({ index: report.index, title: report.title });
        entry.count++;
      }
    }
  }

  return Array.from(concepts.values()).sort((a, b) => b.count - a.count);
}

function generateConsolidatedKB(reports) {
  console.log('📝 Generating knowledge base...\n');
  const keyConcepts = extractKeyConcepts(reports);

  const byCategory = {};
  for (const report of reports) {
    for (const category of report.category) {
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(report);
    }
  }

  let kbContent = `# AI Video Knowledge Base\n\n**Generated:** ${new Date().toLocaleString()}  \n**Videos:** ${reports.length}  \n**Concepts:** ${keyConcepts.length}\n\n---\n\n## Key Concepts (Top 30)\n\n`;

  for (let i = 0; i < Math.min(30, keyConcepts.length); i++) {
    const c = keyConcepts[i];
    kbContent += `${i + 1}. **${c.concept}** - ${c.count} mentions\n`;
  }

  kbContent += `\n---\n\n## By Category\n\n`;
  for (const [category, items] of Object.entries(byCategory).sort(
    (a, b) => b[1].length - a[1].length
  )) {
    kbContent += `### ${category} (${items.length} videos)\n\n`;
    for (const r of items.slice(0, 10)) {
      kbContent += `- **[#${r.index}](${r.url})** - ${r.title}\n`;
    }
    if (items.length > 10) kbContent += `- ... and ${items.length - 10} more\n`;
    kbContent += '\n';
  }

  kbContent += `\n---\n\n## All Videos\n\n`;
  for (const r of reports) {
    kbContent += `### #${r.index}: ${r.title}\n- URL: ${r.url}\n- Categories: ${r.category.join(', ')}\n`;
    if (r.parsedAnalysis?.summary) kbContent += `- Summary: ${r.parsedAnalysis.summary}\n`;
    kbContent += '\n';
  }

  return kbContent;
}

function generateTopicFiles(reports) {
  console.log('📁 Generating topic files...\n');
  const topicsDir = path.join(OUTPUT_DIR, 'topics');
  fs.mkdirSync(topicsDir, { recursive: true });

  const byCategory = {};
  for (const r of reports) {
    for (const c of r.category) {
      if (!byCategory[c]) byCategory[c] = [];
      byCategory[c].push(r);
    }
  }

  for (const [category, items] of Object.entries(byCategory)) {
    const filename = category.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    let content = `# ${category}\n\n*${items.length} videos*\n\n---\n\n`;
    for (const r of items) {
      content += `## #${r.index}: ${r.title}\n- ${r.url}\n`;
      if (r.parsedAnalysis?.summary) content += `- ${r.parsedAnalysis.summary}\n`;
      content += '\n';
    }
    fs.writeFileSync(path.join(topicsDir, filename), content);
    console.log(`   ✅ ${filename}`);
  }
}

async function main() {
  console.log('🚀 Generating Knowledge Base\n' + '═'.repeat(70) + '\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const reports = loadReports();

  if (reports.length === 0) {
    console.log('❌ No reports found. Process videos first.\n');
    process.exit(1);
  }

  const kbContent = generateConsolidatedKB(reports);
  const kbPath = path.join(OUTPUT_DIR, 'consolidated_ai_knowledge.md');
  fs.writeFileSync(kbPath, kbContent);
  console.log(`\n✅ Knowledge base: ${kbPath}`);
  console.log(`   Size: ${(kbContent.length / 1024 / 1024).toFixed(2)} MB\n`);

  generateTopicFiles(reports);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'README.md'),
    `# Knowledge Base\n\nGenerated: ${new Date().toLocaleString()}\n\n- [Consolidated KB](consolidated_ai_knowledge.md)\n- [Topics/](topics/)\n`
  );

  console.log(`\n${'═'.repeat(70)}`);
  console.log('🎉 Complete!');
  console.log(`${'═'.repeat(70)}\n`);
  console.log(`📊 ${reports.length} reports processed`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
}

main().catch(console.error);
