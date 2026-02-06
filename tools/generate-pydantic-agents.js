#!/usr/bin/env node
/*
  Generate Pydantic agent definitions and registry from .agent/agents/*.md
  - Produces Python model files in packages/extension-system/src/agents/pydantic/generated
  - Produces consolidated registry JSON at .agent/agents/consolidated/pydantic_registry.json
*/

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = process.cwd();
const AGENTS_DIR = path.join(ROOT, '.agent', 'agents');
const CONSOLIDATED_DIR = path.join(AGENTS_DIR, 'consolidated');
const OUT_DIR = path.join(
  ROOT,
  'packages',
  'extension-system',
  'src',
  'agents',
  'pydantic',
  'generated'
);

const DEFAULT_INPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    task: { type: 'string', description: 'Primary task to execute' },
    context: { type: 'string', description: 'Additional context' },
    constraints: { type: 'object', description: 'Execution constraints' },
    parameters: { type: 'object', description: 'Structured parameters' },
    resources: { type: 'array', items: { type: 'string' }, description: 'Relevant resources' },
  },
  required: ['task'],
};

const DEFAULT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: {
      type: 'string',
      description: 'Execution status',
      enum: ['success', 'failed', 'partial'],
    },
    summary: { type: 'string', description: 'Concise summary of results' },
    data: { type: 'object', description: 'Structured output data' },
    errors: { type: 'array', items: { type: 'string' }, description: 'Errors, if any' },
    artifacts: {
      type: 'array',
      items: { type: 'string' },
      description: 'Artifact identifiers or paths',
    },
  },
  required: ['status', 'summary'],
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toPascalCase(str) {
  return String(str)
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function normalizeString(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/\r\n/g, '\n').trim();
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: content.trim() };
  const frontmatter = yaml.load(match[1]) || {};
  const body = content.slice(match[0].length).trim();
  return { frontmatter, body };
}

function uniqueStrings(items) {
  const set = new Set();
  for (const item of items) {
    if (item && typeof item === 'string') set.add(item);
  }
  return Array.from(set).sort();
}

function stringifyPy(value) {
  // Use JSON to produce a safe Python string literal for simple values
  return JSON.stringify(value);
}

function toPyLiteral(value) {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'string') return stringifyPy(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) {
    return `[${value.map((v) => toPyLiteral(v)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(
      ([key, val]) => `${stringifyPy(key)}: ${toPyLiteral(val)}`
    );
    return `{${entries.join(', ')}}`;
  }
  return 'None';
}

function capabilityListToPy(capabilities) {
  if (!capabilities.length) return '[]';
  const parts = capabilities.map((cap) => {
    const name = stringifyPy(cap.name);
    const description = stringifyPy(cap.description || '');
    const version = stringifyPy(cap.version || '1.0.0');
    return `AgentCapability(name=${name}, description=${description}, version=${version})`;
  });
  return `[${parts.join(', ')}]`;
}

function listToPy(list) {
  return `[${list.map((v) => stringifyPy(v)).join(', ')}]`;
}

function cloneJson(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function normalizeSchema(schema) {
  if (!schema || typeof schema !== 'object') return null;
  return cloneJson(schema);
}

function mergeSchema(baseSchema, extraSchema) {
  if (!extraSchema) return cloneJson(baseSchema);
  if (!baseSchema) return cloneJson(extraSchema);

  const merged = cloneJson(baseSchema);

  if (extraSchema.type) merged.type = extraSchema.type;
  if (typeof extraSchema.additionalProperties === 'boolean') {
    merged.additionalProperties = extraSchema.additionalProperties;
  }

  if (extraSchema.properties) {
    merged.properties = merged.properties || {};
    for (const [key, value] of Object.entries(extraSchema.properties)) {
      merged.properties[key] = value;
    }
  }

  if (Array.isArray(extraSchema.required)) {
    const required = new Set([...(merged.required || []), ...extraSchema.required]);
    merged.required = Array.from(required);
  }

  return merged;
}

function schemaFromExampleObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  if (obj.type && obj.properties) {
    return normalizeSchema(obj);
  }

  const properties = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.type || value.description || value.properties) {
        properties[key] = value;
        continue;
      }
    }
    if (Array.isArray(value)) {
      const itemType = value.length ? typeof value[0] : 'string';
      properties[key] = {
        type: 'array',
        items: { type: itemType === 'number' ? 'number' : itemType === 'boolean' ? 'boolean' : 'string' },
      };
      continue;
    }
    if (value === null) {
      properties[key] = { type: 'string' };
      continue;
    }
    switch (typeof value) {
      case 'string':
        properties[key] = { type: 'string' };
        break;
      case 'number':
        properties[key] = { type: Number.isInteger(value) ? 'integer' : 'number' };
        break;
      case 'boolean':
        properties[key] = { type: 'boolean' };
        break;
      case 'object':
        properties[key] = { type: 'object' };
        break;
      default:
        properties[key] = { type: 'string' };
    }
  }

  return {
    type: 'object',
    additionalProperties: false,
    properties,
  };
}

function normalizeTypeLabel(rawType) {
  if (!rawType) return null;
  const label = rawType.toLowerCase();
  if (label.includes('string') || label.includes('text') || label.includes('str')) return 'string';
  if (label.includes('uuid') || label.includes('id')) return 'string';
  if (label.includes('int')) return 'integer';
  if (label.includes('number') || label.includes('float') || label.includes('decimal')) return 'number';
  if (label.includes('bool')) return 'boolean';
  if (label.includes('array') || label.includes('list') || label.includes('[]')) return 'array';
  if (label.includes('object') || label.includes('dict') || label.includes('map')) return 'object';
  return 'string';
}

function normalizeItemsSchema(typeLabel) {
  const normalized = normalizeTypeLabel(typeLabel);
  if (!normalized) return null;
  return { type: normalized };
}

function toPythonIdentifier(name) {
  const cleaned = String(name).replace(/[^a-zA-Z0-9_]/g, '_');
  const prefixed = cleaned.match(/^[0-9]/) ? `_${cleaned}` : cleaned;
  const keywords = new Set([
    'False',
    'None',
    'True',
    'and',
    'as',
    'assert',
    'async',
    'await',
    'break',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'nonlocal',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'try',
    'while',
    'with',
    'yield',
  ]);
  if (keywords.has(prefixed)) return `${prefixed}_`;
  return prefixed || 'field';
}

function parseFieldLine(line) {
  const match = line.match(
    /^(?:`([^`]+)`|\*\*([^*]+)\*\*|([A-Za-z0-9_\\-]+))(?:\\s*\\(([^)]+)\\))?(?:\\s*[:-]\\s*)?(.*)$/
  );
  if (!match) return null;
  const name = match[1] || match[2] || match[3];
  if (!name) return null;
  const typeLabel = match[4] || '';
  const description = (match[5] || '').trim();
  const required = /required/i.test(typeLabel) || /required/i.test(description);

  let type = normalizeTypeLabel(typeLabel);
  let items = null;
  if (type === 'array') {
    const ofMatch = typeLabel.match(/array\\s+of\\s+([a-zA-Z]+)/i);
    if (ofMatch) {
      items = normalizeItemsSchema(ofMatch[1]);
    }
  }

  return {
    name,
    type: type || 'string',
    description,
    required,
    items,
  };
}

function extractSectionSchemas(body) {
  const lines = body.split('\n');
  const sections = { input: [], output: [] };
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\\s+(.*)$/);
    if (heading) {
      const title = heading[1].trim().toLowerCase();
      if (title.includes('input')) {
        current = 'input';
      } else if (title.includes('output')) {
        current = 'output';
      } else {
        current = null;
      }
      continue;
    }
    if (current) sections[current].push(line);
  }

  const result = {};
  for (const [section, sectionLines] of Object.entries(sections)) {
    const properties = {};
    const required = new Set();

    for (const line of sectionLines) {
      const bullet = line.match(/^\\s*[-*]\\s+(.*)$/);
      if (!bullet) continue;
      const field = parseFieldLine(bullet[1].trim());
      if (!field) continue;
      properties[field.name] = {
        type: field.type,
        description: field.description || undefined,
        ...(field.items ? { items: field.items } : {}),
      };
      if (field.required) required.add(field.name);
    }

    if (Object.keys(properties).length) {
      result[section] = {
        type: 'object',
        additionalProperties: false,
        properties,
        required: required.size ? Array.from(required) : undefined,
      };
    }
  }

  return result;
}

function extractSchemaFromBody(body) {
  const schemas = extractSectionSchemas(body);

  const codeBlockRegex = /```(json|yaml|yml)\\n([\\s\\S]*?)```/gi;
  let match;
  while ((match = codeBlockRegex.exec(body)) !== null) {
    const lang = match[1].toLowerCase();
    const raw = match[2];
    try {
      const parsed = lang === 'json' ? JSON.parse(raw) : yaml.load(raw);
      const derived = schemaFromExampleObject(parsed);
      if (!derived) continue;
      if (!schemas.input) {
        schemas.input = derived;
      } else if (!schemas.output) {
        schemas.output = derived;
      }
    } catch {
      continue;
    }
  }

  return schemas;
}

function extractSchemaFromFrontmatter(frontmatter) {
  if (!frontmatter || typeof frontmatter !== 'object') return {};

  if (frontmatter.schema && typeof frontmatter.schema === 'object') {
    return {
      input: normalizeSchema(frontmatter.schema.input),
      output: normalizeSchema(frontmatter.schema.output),
      mode: frontmatter.schema_mode || frontmatter.schemaMode,
    };
  }

  return {
    input: normalizeSchema(frontmatter.input_schema || frontmatter.inputSchema),
    output: normalizeSchema(frontmatter.output_schema || frontmatter.outputSchema),
    mode: frontmatter.schema_mode || frontmatter.schemaMode,
  };
}

function resolveSchema(frontmatter, body) {
  const frontmatterSchema = extractSchemaFromFrontmatter(frontmatter);
  const bodySchema = extractSchemaFromBody(body);

  const mode = frontmatterSchema.mode === 'merge' ? 'merge' : 'replace';

  let inputSchema = frontmatterSchema.input || null;
  let outputSchema = frontmatterSchema.output || null;
  let inputSource = inputSchema ? 'frontmatter' : null;
  let outputSource = outputSchema ? 'frontmatter' : null;

  if (!inputSchema && bodySchema.input) {
    inputSchema = bodySchema.input;
    inputSource = 'inferred';
  }
  if (!outputSchema && bodySchema.output) {
    outputSchema = bodySchema.output;
    outputSource = 'inferred';
  }

  if (!inputSchema) {
    inputSchema = cloneJson(DEFAULT_INPUT_SCHEMA);
    inputSource = 'default';
  } else if (mode === 'merge' && frontmatterSchema.input) {
    inputSchema = mergeSchema(DEFAULT_INPUT_SCHEMA, inputSchema);
  } else if (inputSource === 'inferred') {
    inputSchema = mergeSchema(DEFAULT_INPUT_SCHEMA, inputSchema);
  }

  if (!outputSchema) {
    outputSchema = cloneJson(DEFAULT_OUTPUT_SCHEMA);
    outputSource = 'default';
  } else if (mode === 'merge' && frontmatterSchema.output) {
    outputSchema = mergeSchema(DEFAULT_OUTPUT_SCHEMA, outputSchema);
  } else if (outputSource === 'inferred') {
    outputSchema = mergeSchema(DEFAULT_OUTPUT_SCHEMA, outputSchema);
  }

  return {
    inputSchema,
    outputSchema,
    schemaSource: {
      input: inputSource,
      output: outputSource,
    },
  };
}

function getPythonTypeFromSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return { type: 'Any', isEnum: false, defaultFactory: null };
  }

  if (schema.enum && Array.isArray(schema.enum)) {
    return { type: `Literal[${schema.enum.map((v) => stringifyPy(v)).join(', ')}]`, isEnum: true };
  }

  const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (schemaType) {
    case 'string':
      return { type: 'str', isEnum: false };
    case 'integer':
      return { type: 'int', isEnum: false };
    case 'number':
      return { type: 'float', isEnum: false };
    case 'boolean':
      return { type: 'bool', isEnum: false };
    case 'array': {
      const items = schema.items || {};
      const itemType = getPythonTypeFromSchema(items).type || 'Any';
      return { type: `List[${itemType}]`, isEnum: false, defaultFactory: 'list' };
    }
    case 'object':
      return { type: 'Dict[str, Any]', isEnum: false, defaultFactory: 'dict' };
    default:
      return { type: 'Any', isEnum: false };
  }
}

function renderModelFromSchema(className, baseClass, schema) {
  const properties = (schema && schema.properties) || {};
  const required = new Set((schema && schema.required) || []);
  const lines = [];
  let usesLiteral = false;

  const keys = Object.keys(properties).sort();
  for (const key of keys) {
    const propertySchema = properties[key] || {};
    const isRequired = required.has(key);
    const description = propertySchema.description || '';
    const pyTypeInfo = getPythonTypeFromSchema(propertySchema);
    if (pyTypeInfo.isEnum) usesLiteral = true;

    const safeKey = toPythonIdentifier(key);
    const alias = safeKey !== key ? key : null;

    let typeDecl = pyTypeInfo.type || 'Any';
    let defaultValue = 'None';
    let defaultFactory = pyTypeInfo.defaultFactory || null;

    if (propertySchema.default !== undefined) {
      defaultFactory = null;
      defaultValue = stringifyPy(propertySchema.default);
    } else if (isRequired) {
      defaultValue = '...';
      defaultFactory = null;
    } else if (defaultFactory) {
      defaultValue = null;
    } else {
      typeDecl = `Optional[${typeDecl}]`;
    }

    let fieldLine = '';
    const aliasClause = alias ? `, alias=${stringifyPy(alias)}` : '';
    if (defaultFactory) {
      fieldLine = `    ${safeKey}: ${typeDecl} = Field(default_factory=${defaultFactory}, description=${stringifyPy(description)}${aliasClause})`;
    } else {
      fieldLine = `    ${safeKey}: ${typeDecl} = Field(${defaultValue}, description=${stringifyPy(description)}${aliasClause})`;
    }
    lines.push(fieldLine);
  }

  if (!lines.length) {
    lines.push('    pass');
  }

  const classLines = [`class ${className}(${baseClass}):`, ...lines, ''];
  return { classLines: classLines.join('\n'), usesLiteral };
}

function writeAgentFile(agent, shouldWrite = true) {
  const {
    classPrefix,
    fileName,
    agentId,
    name,
    description,
    type,
    provider,
    platform,
    capabilities,
    tools,
    tags,
    systemPrompt,
    schema,
  } = agent;

  const inputClass = `${classPrefix}Input`;
  const outputClass = `${classPrefix}Output`;
  const metadataClass = `${classPrefix}Metadata`;

  const inputRender = renderModelFromSchema(inputClass, 'AgentInputBase', schema.input);
  const outputRender = renderModelFromSchema(outputClass, 'AgentOutputBase', schema.output);

  const needsLiteral = inputRender.usesLiteral || outputRender.usesLiteral;

  const content = `from typing import Any, Dict, List, Optional${needsLiteral ? ', Literal' : ''}\n\nfrom pydantic import BaseModel, Field\n\nfrom .base import AgentCapability, AgentMetadataBase, AgentInputBase, AgentOutputBase\n\n\n${inputRender.classLines}\n\n${outputRender.classLines}\n\nclass ${metadataClass}(AgentMetadataBase):\n    agent_id: str = ${stringifyPy(agentId)}\n    name: str = ${stringifyPy(name)}\n    description: str = ${stringifyPy(description)}\n    type: str = ${stringifyPy(type)}\n    provider: str = ${stringifyPy(provider)}\n    platform: str = ${stringifyPy(platform)}\n    version: str = ${stringifyPy('1.0.0')}\n    capabilities: List[AgentCapability] = ${capabilityListToPy(capabilities)}\n    tools: List[str] = ${listToPy(tools)}\n    tags: List[str] = ${listToPy(tags)}\n    system_prompt: str = ${stringifyPy(systemPrompt)}\n    input_model: str = ${stringifyPy(inputClass)}\n    output_model: str = ${stringifyPy(outputClass)}\n    schema: Dict[str, Any] = ${toPyLiteral(schema)}\n\n\n__all__ = [\n    ${stringifyPy(inputClass)},\n    ${stringifyPy(outputClass)},\n    ${stringifyPy(metadataClass)},\n]\n`;

  const outputPath = path.join(OUT_DIR, fileName);
  if (shouldWrite) {
    fs.writeFileSync(outputPath, content, 'utf8');
  }
  return { inputClass, outputClass, metadataClass, outputPath, content };
}

function buildRegistryEntry(agent, classes) {
  return {
    agent_id: agent.agentId,
    name: agent.name,
    version: '1.0.0',
    description: agent.description,
    type: agent.type,
    provider: agent.provider,
    platform: agent.platform,
    capabilities: agent.capabilities,
    tools: agent.tools,
    tags: agent.tags,
    system_prompt: agent.systemPrompt,
    input_model: classes.inputClass,
    output_model: classes.outputClass,
    schema: agent.schema,
    schema_source: agent.schemaSource,
    metadata: agent.metadata || {},
  };
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');

  if (!fs.existsSync(AGENTS_DIR)) {
    console.error(`Agents directory not found: ${AGENTS_DIR}`);
    process.exit(1);
  }

  ensureDir(OUT_DIR);
  ensureDir(CONSOLIDATED_DIR);

  const files = fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const registry = [];
  const initExports = [];
  const generatedFiles = new Map();

  for (const file of files) {
    const filePath = path.join(AGENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);

    const agentId = path.basename(file, '.md');
    const name = normalizeString(frontmatter.name) || agentId;
    const description = normalizeString(frontmatter.description) || '';

    const tools = Array.isArray(frontmatter.tools)
      ? frontmatter.tools.filter((tool) => typeof tool === 'string')
      : [];
    const capabilities = Array.isArray(frontmatter.capabilities)
      ? frontmatter.capabilities
      : [];

    const combinedCapabilities = uniqueStrings([
      ...capabilities.map((cap) => (typeof cap === 'string' ? cap : cap?.name)).filter(Boolean),
      ...tools,
    ]);

    const capObjects = combinedCapabilities.map((cap) => {
      const existing = capabilities.find(
        (entry) => entry && typeof entry === 'object' && entry.name === cap
      );
      return {
        name: cap,
        description: existing?.description || '',
        version: existing?.version || '1.0.0',
      };
    });

    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

    const type = normalizeString(frontmatter.type) || 'TASK';
    const provider = normalizeString(frontmatter.provider) || 'local';
    const platform = normalizeString(frontmatter.platform) || 'tnf';
    const metadata = frontmatter.metadata && typeof frontmatter.metadata === 'object'
      ? frontmatter.metadata
      : {};

    const { inputSchema, outputSchema, schemaSource } = resolveSchema(frontmatter, body);
    const schema = {
      input: inputSchema,
      output: outputSchema,
    };

    const classPrefix = toPascalCase(agentId);
    const fileName = `${agentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.py`;

    const agent = {
      agentId,
      name,
      description,
      type,
      provider,
      platform,
      capabilities: capObjects,
      tools: tools || [],
      tags: uniqueStrings(tags),
      systemPrompt: body,
      classPrefix,
      fileName,
      schema,
      schemaSource,
      metadata,
    };

    const classes = writeAgentFile(agent, false);
    generatedFiles.set(classes.outputPath, classes.content);
    registry.push(buildRegistryEntry(agent, classes));

    initExports.push({
      module: fileName.replace(/\.py$/, ''),
      inputClass: classes.inputClass,
      outputClass: classes.outputClass,
      metadataClass: classes.metadataClass,
    });
  }

  // Write consolidated registry
  const registryPath = path.join(CONSOLIDATED_DIR, 'pydantic_registry.json');
  const registryContent = JSON.stringify(registry, null, 2);
  generatedFiles.set(registryPath, registryContent);

  // Write __init__.py
  const initLines = [];
  for (const exp of initExports) {
    initLines.push(
      `from .${exp.module} import ${exp.inputClass}, ${exp.outputClass}, ${exp.metadataClass}`
    );
  }
  initLines.push('');
  const allNames = initExports.flatMap((exp) => [
    exp.inputClass,
    exp.outputClass,
    exp.metadataClass,
  ]);
  initLines.push(`__all__ = [${allNames.map((n) => JSON.stringify(n)).join(', ')}]`);
  initLines.push('');

  generatedFiles.set(path.join(OUT_DIR, '__init__.py'), initLines.join('\n'));

  if (checkOnly) {
    let hasChanges = false;
    for (const [filePath, expected] of generatedFiles.entries()) {
      if (!fs.existsSync(filePath)) {
        console.error(`Missing generated file: ${filePath}`);
        hasChanges = true;
        continue;
      }
      const actual = fs.readFileSync(filePath, 'utf8');
      if (actual !== expected) {
        console.error(`Generated file out of date: ${filePath}`);
        hasChanges = true;
      }
    }

    const expectedFiles = new Set(generatedFiles.keys());
    const existingGenerated = fs
      .readdirSync(OUT_DIR)
      .filter((name) => name.endsWith('.py'))
      .map((name) => path.join(OUT_DIR, name));

    for (const filePath of existingGenerated) {
      if (!expectedFiles.has(filePath)) {
        console.error(`Stale generated file detected: ${filePath}`);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      console.error('Pydantic registry check failed. Re-run generator.');
      process.exit(1);
    }
    console.log(`Pydantic registry is up to date (${registry.length} agents).`);
    return;
  }

  for (const [filePath, contentToWrite] of generatedFiles.entries()) {
    fs.writeFileSync(filePath, contentToWrite, 'utf8');
  }

  console.log(`Generated ${registry.length} Pydantic agents.`);
}

main();
