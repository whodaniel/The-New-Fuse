#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
const CONCORDANCE_DIR = process.env.CONCORDANCE_DIR ||
    '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/concordance_results';
const SUPABASE_BASE = process.env.SUPABASE_CONCORDANCE_URL ||
    'https://wslydgtgindrywldatbv.supabase.co/storage/v1/object/public/concordance/20260508_124525';
const VIZ_JSON_URL = `${SUPABASE_BASE}/concordance_viz_data.json`;
const TSV_GZ_PATH = `${CONCORDANCE_DIR}/concordance.tsv.gz`;
const PER_FILE_PATH = `${CONCORDANCE_DIR}/per_file_index.tsv.gz`;
const STATS_PATH = `${CONCORDANCE_DIR}/stats.json`;
let vizDataCache = null;
let statsCache = null;
async function fetchVizData() {
    if (vizDataCache)
        return vizDataCache;
    try {
        const localPath = `${CONCORDANCE_DIR}/concordance_viz_data.json`;
        const fs = await import('fs/promises');
        const raw = await fs.readFile(localPath, 'utf-8');
        vizDataCache = JSON.parse(raw);
        return vizDataCache;
    }
    catch {
        const resp = await fetch(VIZ_JSON_URL);
        vizDataCache = await resp.json();
        return vizDataCache;
    }
}
async function getStats() {
    if (statsCache)
        return statsCache;
    try {
        const fs = await import('fs/promises');
        const raw = await fs.readFile(STATS_PATH, 'utf-8');
        statsCache = JSON.parse(raw);
        return statsCache;
    }
    catch {
        return null;
    }
}
async function searchTsv(pattern, maxResults = 20) {
    try {
        const cmd = `zgrep -i "${pattern.replace(/"/g, '\\"')}" "${TSV_GZ_PATH}" | head -${maxResults}`;
        const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        return output.trim().split('\n').filter(Boolean);
    }
    catch {
        return [];
    }
}
async function searchPerFile(filepath, maxResults = 5) {
    try {
        const cmd = `zgrep -i "${filepath.replace(/"/g, '\\"')}" "${PER_FILE_PATH}" | head -${maxResults}`;
        const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        return output.trim().split('\n').filter(Boolean);
    }
    catch {
        return [];
    }
}
function parseTsvLine(line) {
    const parts = line.split('\t', 2);
    if (parts.length < 2)
        return { word: parts[0] || '', count: 0, files: [] };
    const word = parts[0];
    const refs = parts[1];
    let count = 0;
    const files = [];
    for (const ref of refs.split(';')) {
        const colonIdx = ref.indexOf(':');
        if (colonIdx < 0)
            continue;
        const file = ref.slice(0, colonIdx);
        files.push(file);
        const linesStr = ref.slice(colonIdx + 1);
        for (const entry of linesStr.split(',')) {
            const trimmed = entry.trim();
            if (trimmed.startsWith('..+')) {
                count += parseInt(trimmed.slice(3)) || 0;
            }
            else {
                count += 1;
            }
        }
    }
    return { word, count, files };
}
const server = new Server({ name: 'tnf-concordance-server', version: '1.0.0' }, { capabilities: { tools: {}, resources: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'lookup_identifier',
            description: 'Look up how often an identifier (word, function name, variable, etc.) appears across the TNF codebase. Returns occurrence count and source files.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Identifier or pattern to search for (case-insensitive, supports substring matching)',
                    },
                    max_results: {
                        type: 'number',
                        description: 'Maximum results to return (default 20)',
                        default: 20,
                    },
                },
                required: ['query'],
            },
        },
        {
            name: 'top_identifiers',
            description: 'Get the most frequent identifiers in the TNF codebase. Useful for understanding dominant coding patterns and vocabulary.',
            inputSchema: {
                type: 'object',
                properties: {
                    count: {
                        type: 'number',
                        description: 'Number of top identifiers to return (default 50, max 500)',
                        default: 50,
                    },
                    category: {
                        type: 'string',
                        description: 'Filter by category: Keywords & Reserved, Types & Interfaces, Function Names, Agent & System, UI & Components, Data & State, Error & Status, Config & Env, Network & API, Domain-Specific',
                    },
                },
                required: [],
            },
        },
        {
            name: 'power_phrases',
            description: 'Get high-value vocabulary and communication patterns for AI agent effectiveness. Returns Agent Directives, Communication Patterns, Effective Vocabulary, System Intelligence, Resilience Patterns, and Governance terms with their occurrence counts.',
            inputSchema: {
                type: 'object',
                properties: {
                    group: {
                        type: 'string',
                        description: 'Specific group to query: agent, communication, vocabulary, intelligence, resilience, governance (omit for all)',
                    },
                },
                required: [],
            },
        },
        {
            name: 'file_identifiers',
            description: 'Find which identifiers appear in a specific source file. Useful for understanding file complexity and dependencies.',
            inputSchema: {
                type: 'object',
                properties: {
                    filepath: {
                        type: 'string',
                        description: 'File path to search for (supports partial matching)',
                    },
                    max_results: {
                        type: 'number',
                        description: 'Maximum results to return (default 5)',
                        default: 5,
                    },
                },
                required: ['filepath'],
            },
        },
        {
            name: 'concordance_stats',
            description: 'Get overall concordance statistics: total identifiers, total occurrences, files indexed, category breakdown.',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'lookup_identifier': {
            const query = args.query;
            const maxResults = args.max_results || 20;
            const lines = await searchTsv(query, maxResults);
            const results = lines.map(parseTsvLine);
            if (results.length === 0) {
                return {
                    content: [{ type: 'text', text: `No identifiers matching "${query}" found.` }],
                };
            }
            const text = results
                .map((r) => `${r.word}: ${r.count.toLocaleString()} occurrences in ${r.files.length} files\n  Top files: ${r.files.slice(0, 5).join(', ')}`)
                .join('\n\n');
            return { content: [{ type: 'text', text }] };
        }
        case 'top_identifiers': {
            const count = Math.min(args.count || 50, 500);
            const category = args.category;
            const data = await fetchVizData();
            let words = data.topWords;
            if (category && data.categories[category]) {
                const catWordSet = new Set(data.categories[category].topWords.map((w) => w.word));
                words = words.filter((w) => catWordSet.has(w.word));
            }
            const top = words.slice(0, count);
            const text = top.map((w) => `${w.word}: ${w.count.toLocaleString()}`).join('\n');
            return { content: [{ type: 'text', text }] };
        }
        case 'power_phrases': {
            const group = args.group;
            const data = await fetchVizData();
            const groups = {
                agent: {
                    title: 'Agent Directives',
                    patterns: [
                        'directive',
                        'autonomy',
                        'orchestrat',
                        'self_prompt',
                        'agent_loop',
                        'prime_directive',
                        'self_improve',
                        'coordination',
                        'heartbeat',
                        'consciousness',
                    ],
                },
                communication: {
                    title: 'Communication Patterns',
                    patterns: [
                        'broadcast',
                        'relay',
                        'dispatch',
                        'subscribe',
                        'emit',
                        'notify',
                        'handoff',
                        'bridge',
                        'channel',
                        'message',
                        'protocol',
                        'negotiate',
                    ],
                },
                vocabulary: {
                    title: 'Effective Vocabulary',
                    patterns: [
                        'execute',
                        'actualiz',
                        'optimize',
                        'validate',
                        'enrich',
                        'transform',
                        'orchestrat',
                        'compounding',
                        'cascade',
                        'amplif',
                        'accelerat',
                        'operationaliz',
                    ],
                },
                intelligence: {
                    title: 'System Intelligence',
                    patterns: [
                        'embedding',
                        'vector',
                        'similarity',
                        'retrieval',
                        'rag',
                        'semantic',
                        'knowledge',
                        'memory',
                        'context_pack',
                        'skill_bank',
                        'blueprint',
                    ],
                },
                resilience: {
                    title: 'Resilience Patterns',
                    patterns: [
                        'retry',
                        'fallback',
                        'circuit',
                        'degraded',
                        'graceful',
                        'recovery',
                        'resilien',
                        'timeout',
                        'backoff',
                        'health_check',
                        'watchdog',
                    ],
                },
                governance: {
                    title: 'Governance and Control',
                    patterns: [
                        'authorize',
                        'permission',
                        'policy',
                        'compliance',
                        'audit',
                        'govern',
                        'enforce',
                        'constraint',
                        'mandate',
                        'escalat',
                    ],
                },
            };
            const selected = group ? { [group]: groups[group] } : groups;
            const lines = [];
            for (const [, g] of Object.entries(selected)) {
                lines.push(`\n== ${g.title} ==`);
                for (const pat of g.patterns) {
                    const matches = data.topWords.filter((w) => w.word.toLowerCase().includes(pat.toLowerCase()));
                    if (matches.length > 0) {
                        lines.push(`  ${pat}: ${matches.map((m) => `${m.word}(${m.count.toLocaleString()})`).join(', ')}`);
                    }
                    else {
                        const tsvResults = await searchTsv(pat, 3);
                        if (tsvResults.length > 0) {
                            const parsed = tsvResults.map(parseTsvLine);
                            lines.push(`  ${pat}: ${parsed.map((m) => `${m.word}(${m.count.toLocaleString()})`).join(', ')}`);
                        }
                        else {
                            lines.push(`  ${pat}: (not found)`);
                        }
                    }
                }
            }
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        case 'file_identifiers': {
            const filepath = args.filepath;
            const maxResults = args.max_results || 5;
            const lines = await searchPerFile(filepath, maxResults);
            if (lines.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No files matching "${filepath}" found in per-file index.`,
                        },
                    ],
                };
            }
            const text = lines
                .map((l) => {
                const parts = l.split('\t', 2);
                const file = parts[0];
                const ids = parts[1]
                    ? parts[1]
                        .split(';')
                        .slice(0, 20)
                        .map((ref) => {
                        const colonIdx = ref.indexOf(':');
                        return colonIdx >= 0 ? ref.slice(0, colonIdx) : ref;
                    })
                        .join(', ')
                    : '';
                return `${file}:\n  ${ids}`;
            })
                .join('\n\n');
            return { content: [{ type: 'text', text }] };
        }
        case 'concordance_stats': {
            const data = await fetchVizData();
            const stats = await getStats();
            const m = data.metadata;
            const lines = [
                `Total Unique Identifiers: ${m.totalWords.toLocaleString()}`,
                `Total Occurrences: ${m.totalOccurrences.toLocaleString()}`,
                `Source Files Indexed: ${m.filesIndexed.toLocaleString()}`,
                `Categories: ${Object.keys(data.categories).length}`,
                '',
                'Category Breakdown:',
            ];
            for (const [name, cat] of Object.entries(data.categories)) {
                lines.push(`  ${name}: ${cat.count} identifiers, ${cat.totalOccurrences.toLocaleString()} occurrences`);
            }
            if (stats) {
                lines.push('', `Generated: ${stats.generated || 'unknown'}`);
            }
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        default:
            return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
});
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
        {
            uri: 'concordance://viz-data',
            name: 'Concordance Viz Data (top 500)',
            mimeType: 'application/json',
        },
        { uri: 'concordance://stats', name: 'Concordance Statistics', mimeType: 'application/json' },
    ],
}));
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === 'concordance://viz-data') {
        const data = await fetchVizData();
        return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
        };
    }
    if (uri === 'concordance://stats') {
        const stats = await getStats();
        return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(stats, null, 2) }],
        };
    }
    throw new Error(`Unknown resource: ${uri}`);
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('TNF Concordance MCP Server running on stdio');
}
main().catch(console.error);
//# sourceMappingURL=index.js.map