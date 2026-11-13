/**
 * Guard the /models + `tnf models` argument resolver so a bare query searches
 * instead of being misread as an unknown provider id.
 *
 * Run: npx tsx src/services/ModelsService.resolve-args.test.ts
 */
import { filterModelsByQuery, resolveModelsCliArgs, type ModelInfo } from './ModelsService.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
    fail += 1;
  }
}

const known = ['openai', 'google', 'anthropic', 'aihubmix', 'groq'];

function resolve(
  providerArg?: string,
  searchArg?: string,
  searchOption?: string
): { provider?: string; searchQuery: string } {
  return resolveModelsCliArgs({
    providerArg,
    searchArg,
    searchOption,
    knownProviderIds: known,
  });
}

check(
  'bare unknown token searches',
  resolve('gpt').provider === undefined && resolve('gpt').searchQuery === 'gpt'
);
check(
  'bare known provider scopes',
  resolve('openai').provider === 'openai' && resolve('openai').searchQuery === ''
);
check(
  'provider + search',
  resolve('openai', 'gpt').provider === 'openai' && resolve('openai', 'gpt').searchQuery === 'gpt'
);
check(
  'two unknown tokens become one search',
  resolve('gpt', 'oss').provider === undefined && resolve('gpt', 'oss').searchQuery === 'gpt oss'
);
check(
  '-s wins as search; unknown first ignored as provider',
  resolve('gpt', undefined, 'claude').provider === undefined &&
    resolve('gpt', undefined, 'claude').searchQuery === 'claude'
);
check(
  '-s with known provider keeps provider scope',
  resolve('openai', undefined, 'gpt').provider === 'openai' &&
    resolve('openai', undefined, 'gpt').searchQuery === 'gpt'
);
check(
  'provider match is case-insensitive',
  resolve('OpenAI').provider === 'OpenAI' && resolve('OpenAI').searchQuery === ''
);

const sample: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'aihubmix' },
  { id: 'llama-3.3-70b-versatile', name: 'llama-3.3-70b-versatile', provider: 'groq' },
];
check('filter matches id', filterModelsByQuery(sample, 'gpt').length === 1);
check('filter matches name', filterModelsByQuery(sample, 'sonnet').length === 1);
check('filter matches provider', filterModelsByQuery(sample, 'groq').length === 1);
check('empty query returns all', filterModelsByQuery(sample, '').length === 3);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
