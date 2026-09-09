/**
 * Go extractor.
 *
 * Grammar shapes verified against the real grammar:
 *   import_spec          `path` field is an interpreted_string_literal (quoted)
 *   type_spec            `name` + `type` (struct_type / interface_type / ...)
 *   method_declaration   `name` is a field_identifier, `receiver` is a parameter_list
 *   call_expression      `function` is `identifier` or `selector_expression[field]`
 */
import type { Node as TSNode } from 'web-tree-sitter';
import { enclosing, field, fieldText, loc, symbolId, walk, type ExtractorContext } from './base.js';

const CALL_SCOPES = ['method_declaration', 'function_declaration', 'func_literal'] as const;

const unquote = (raw: string): string => raw.replace(/^["`]|["`]$/g, '');

/** `(s *S)` and `(s S)` both name the receiver type S. */
function receiverType(node: TSNode): string | undefined {
  const receiver = field(node, 'receiver');
  if (!receiver) return undefined;
  const decl = receiver.namedChildren.find((c) => c?.type === 'parameter_declaration');
  const typeNode = decl ? field(decl, 'type') : undefined;
  return typeNode?.text.replace(/^\*/, '');
}

export function extractGo(ctx: ExtractorContext): void {
  const { root, out, relPath } = ctx;

  // ---- pass 1: definitions -------------------------------------------------
  for (const node of walk(root)) {
    switch (node.type) {
      case 'type_spec': {
        const name = fieldText(node, 'name');
        if (!name) break;
        const kind = field(node, 'type')?.type === 'interface_type' ? 'interface' : 'type';
        out.defineSymbol(name, kind, node);
        break;
      }
      case 'const_spec': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'constant', node);
        break;
      }
      case 'function_declaration': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'function', node);
        break;
      }
      case 'method_declaration': {
        const name = fieldText(node, 'name');
        if (!name) break;
        const owner = receiverType(node);
        const qualified = owner ? `${owner}.${name}` : name;
        const id = out.defineSymbol(qualified, 'method', node, { ...(owner ? { receiver: owner } : {}) });
        if (!out.localDefs.has(name)) out.localDefs.set(name, id);
        if (owner) {
          out.addEdge({
            source: symbolId(relPath, owner),
            target: id,
            relation: 'contains',
            confidence: 'EXTRACTED',
            evidence: `method with receiver ${owner} at ${relPath}:${loc(node)}`,
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
      case 'import_spec': {
        const path = fieldText(node, 'path');
        if (path) out.addImport(unquote(path), node);
        break;
      }
      case 'call_expression': {
        const fn = field(node, 'function');
        if (!fn) break;
        const viaMember = fn.type === 'selector_expression';
        const callee = fn.type === 'identifier' ? fn.text : viaMember ? fieldText(fn, 'field') : undefined;
        if (callee) out.addCall(callerId(ctx, node), callee, node, viaMember);
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
  if (scope.type === 'method_declaration') {
    const owner = receiverType(scope);
    return symbolId(ctx.relPath, owner ? `${owner}.${name}` : name);
  }
  return symbolId(ctx.relPath, name);
}
