/**
 * Python extractor.
 *
 * Grammar shapes verified against the real grammar:
 *   import_statement        namedChildren are dotted_name / aliased_import
 *   import_from_statement   `module_name` field is the module, remaining children are the names
 *   class_definition        `name` field, `superclasses` field is an argument_list
 *   call                    `function` field is `identifier` or `attribute[attribute]`
 */
import type { Node as TSNode } from 'web-tree-sitter';
import { enclosing, field, fieldText, loc, symbolId, walk, type ExtractorContext } from './base.js';

const CALL_SCOPES = ['function_definition'] as const;

export function extractPython(ctx: ExtractorContext): void {
  const { root, out, relPath } = ctx;

  // ---- pass 1: definitions -------------------------------------------------
  for (const node of walk(root)) {
    switch (node.type) {
      case 'class_definition': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'class', node);
        break;
      }
      case 'function_definition': {
        const name = fieldText(node, 'name');
        if (!name) break;
        const owner = enclosing(node, ['class_definition']);
        const ownerName = owner ? fieldText(owner, 'name') : undefined;
        // A def inside a class body is a method; at module level it is a function.
        const qualified = ownerName ? `${ownerName}.${name}` : name;
        const id = out.defineSymbol(qualified, ownerName ? 'method' : 'function', node, {
          ...(ownerName ? { class: ownerName } : {}),
        });
        if (ownerName) {
          if (!out.localDefs.has(name)) out.localDefs.set(name, id);
          out.addEdge({
            source: symbolId(relPath, ownerName),
            target: id,
            relation: 'contains',
            confidence: 'EXTRACTED',
            evidence: `def inside class body at ${relPath}:${loc(node)}`,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  // ---- pass 2: references --------------------------------------------------
  for (const node of walk(root)) {
    switch (node.type) {
      case 'import_statement': {
        for (const child of node.namedChildren) {
          const spec = child?.type === 'aliased_import' ? fieldText(child, 'name') : child?.text;
          if (spec) out.addImport(spec, node);
        }
        break;
      }
      case 'import_from_statement': {
        const moduleName = fieldText(node, 'module_name');
        if (moduleName) out.addImport(moduleName, node);
        break;
      }
      case 'class_definition': {
        const name = fieldText(node, 'name');
        const bases = field(node, 'superclasses');
        if (!name || !bases) break;
        for (const base of bases.namedChildren) {
          const baseName = base?.text;
          if (!baseName) continue;
          const target = out.localDefs.get(baseName) ?? `external:${baseName}`;
          if (!out.localDefs.has(baseName)) {
            out.addNode({
              id: target,
              label: baseName,
              kind: 'external',
              sourceFile: '',
              meta: { unresolvedType: true },
            });
          }
          out.addEdge({
            source: symbolId(relPath, name),
            target,
            relation: 'extends',
            confidence: 'EXTRACTED',
            evidence: `base class listed at ${relPath}:${loc(bases)}`,
          });
        }
        break;
      }
      case 'call': {
        const fn = field(node, 'function');
        if (!fn) break;
        const viaMember = fn.type === 'attribute';
        const callee = fn.type === 'identifier' ? fn.text : viaMember ? fieldText(fn, 'attribute') : undefined;
        const onSelf = viaMember && fieldText(fn, 'object') === 'self';
        if (callee) out.addCall(callerId(ctx, node), callee, node, viaMember && !onSelf);
        break;
      }
      default:
        break;
    }
  }
}

function callerId(ctx: ExtractorContext, node: TSNode): string {
  const scope = enclosing(node, CALL_SCOPES);
  if (!scope) return ctx.relPath;
  const name = fieldText(scope, 'name');
  if (!name) return ctx.relPath;
  const owner = enclosing(scope, ['class_definition']);
  const ownerName = owner ? fieldText(owner, 'name') : undefined;
  return symbolId(ctx.relPath, ownerName ? `${ownerName}.${name}` : name);
}
