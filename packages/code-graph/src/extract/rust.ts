/**
 * Rust extractor.
 *
 * Grammar shapes verified against the real grammar:
 *   use_declaration   `argument` field is an identifier / scoped_identifier / use_list
 *   impl_item         `type` field always; `trait` field only for `impl Trait for Type`
 *   function_item     `name` field; inside an impl body it is a method
 *   call_expression   `function` field is `identifier` or a scoped/field expression
 */
import type { Node as TSNode } from 'web-tree-sitter';
import { enclosing, field, fieldText, loc, symbolId, walk, type ExtractorContext } from './base.js';

const CALL_SCOPES = ['function_item'] as const;

/** The type an `impl` block is for, e.g. `S` in `impl T for S`. */
function implType(node: TSNode): string | undefined {
  return fieldText(node, 'type');
}

export function extractRust(ctx: ExtractorContext): void {
  const { root, out, relPath } = ctx;

  // ---- pass 1: definitions -------------------------------------------------
  for (const node of walk(root)) {
    switch (node.type) {
      case 'struct_item':
      case 'enum_item': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'type', node);
        break;
      }
      case 'trait_item': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'interface', node);
        break;
      }
      case 'const_item':
      case 'static_item': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'constant', node);
        break;
      }
      case 'function_item': {
        const name = fieldText(node, 'name');
        if (!name) break;
        const owner = enclosing(node, ['impl_item']);
        const ownerName = owner ? implType(owner) : undefined;
        const qualified = ownerName ? `${ownerName}.${name}` : name;
        const id = out.defineSymbol(qualified, ownerName ? 'method' : 'function', node, {
          ...(ownerName ? { impl: ownerName } : {}),
        });
        if (ownerName) {
          if (!out.localDefs.has(name)) out.localDefs.set(name, id);
          out.addEdge({
            source: symbolId(relPath, ownerName),
            target: id,
            relation: 'contains',
            confidence: 'EXTRACTED',
            evidence: `fn inside impl block at ${relPath}:${loc(node)}`,
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
      case 'use_declaration': {
        const arg = field(node, 'argument');
        if (arg?.text) out.addImport(arg.text, node);
        break;
      }
      case 'impl_item': {
        // `impl Trait for Type` is the Rust spelling of `implements`.
        const traitName = fieldText(node, 'trait');
        const typeName = implType(node);
        if (!traitName || !typeName) break;
        const target = out.localDefs.get(traitName) ?? `external:${traitName}`;
        if (!out.localDefs.has(traitName)) {
          out.addNode({
            id: target,
            label: traitName,
            kind: 'external',
            sourceFile: '',
            meta: { unresolvedType: true },
          });
        }
        out.addEdge({
          source: symbolId(relPath, typeName),
          target,
          relation: 'implements',
          confidence: 'EXTRACTED',
          evidence: `impl ${traitName} for ${typeName} at ${relPath}:${loc(node)}`,
        });
        break;
      }
      case 'call_expression': {
        const fn = field(node, 'function');
        if (!fn) break;
        const viaMember = fn.type === 'field_expression';
        const callee =
          fn.type === 'identifier'
            ? fn.text
            : viaMember
              ? fieldText(fn, 'field')
              : fn.type === 'scoped_identifier'
                ? fieldText(fn, 'name')
                : undefined;
        const onSelf = viaMember && fieldText(fn, 'value') === 'self';
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
  const owner = enclosing(scope, ['impl_item']);
  const ownerName = owner ? implType(owner) : undefined;
  return symbolId(ctx.relPath, ownerName ? `${ownerName}.${name}` : name);
}
