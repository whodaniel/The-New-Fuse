/**
 * TypeScript / TSX / JavaScript extractor.
 *
 * Node types below were read off the real @vscode/tree-sitter-wasm grammar, not
 * assumed: `class_heritage > extends_clause[value]` and `implements_clause`, and
 * `call_expression[function]` resolving to either `identifier` or
 * `member_expression[property]`.
 *
 * Two passes over the tree: definitions first, then references. A single pass
 * would mark every call to a function declared later in the file as unresolved,
 * which would downgrade honest EXTRACTED edges to INFERRED for no reason.
 */
import type { Node as TSNode } from 'web-tree-sitter';
import { enclosing, field, fieldText, loc, symbolId, walk, type ExtractorContext } from './base.js';

/** Nodes that own a call site, innermost first. */
const CALL_SCOPES = [
  'method_definition',
  'function_declaration',
  'function_expression',
  'arrow_function',
  'generator_function_declaration',
] as const;

/** Strip the quote characters tree-sitter keeps on a `string` node. */
const unquote = (raw: string): string => raw.replace(/^['"`]|['"`]$/g, '');

function className(node: TSNode): string | undefined {
  return fieldText(node, 'name');
}

export function extractTypeScript(ctx: ExtractorContext): void {
  const { root, out, relPath } = ctx;

  // ---- pass 1: definitions -------------------------------------------------
  for (const node of walk(root)) {
    switch (node.type) {
      case 'class_declaration':
      case 'abstract_class_declaration': {
        const name = className(node);
        if (name) out.defineSymbol(name, 'class', node);
        break;
      }
      case 'interface_declaration': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'interface', node);
        break;
      }
      case 'type_alias_declaration': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'type', node);
        break;
      }
      case 'function_declaration':
      case 'generator_function_declaration': {
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'function', node);
        break;
      }
      case 'method_definition': {
        const method = fieldText(node, 'name');
        const owner = enclosing(node, ['class_declaration', 'abstract_class_declaration']);
        if (!method) break;
        const ownerName = owner ? className(owner) : undefined;
        const qualified = ownerName ? `${ownerName}.${method}` : method;
        const id = out.defineSymbol(qualified, 'method', node, { class: ownerName });
        // Also answer to the bare name so `this.other()` resolves, but never
        // clobber a real top-level definition that already owns that name.
        if (!out.localDefs.has(method)) out.localDefs.set(method, id);
        if (ownerName) {
          out.addEdge({
            source: symbolId(relPath, ownerName),
            target: id,
            relation: 'contains',
            confidence: 'EXTRACTED',
            evidence: `method declared in class body at ${relPath}:${loc(node)}`,
          });
        }
        break;
      }
      case 'variable_declarator': {
        // Only `const` at module scope is treated as a constant worth a node.
        const decl = node.parent;
        if (decl?.type !== 'lexical_declaration' || !decl.text.startsWith('const')) break;
        const name = fieldText(node, 'name');
        if (name) out.defineSymbol(name, 'constant', node);
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
        const source = fieldText(node, 'source');
        if (source) out.addImport(unquote(source), node);
        break;
      }
      case 'class_declaration':
      case 'abstract_class_declaration': {
        const name = className(node);
        if (!name) break;
        const classId = symbolId(relPath, name);
        const heritage = node.namedChildren.find((c) => c?.type === 'class_heritage');
        if (!heritage) break;
        for (const clause of heritage.namedChildren) {
          if (!clause) continue;
          if (clause.type === 'extends_clause') {
            const base = field(clause, 'value')?.text ?? clause.namedChildren[0]?.text;
            if (base) {
              out.addEdge({
                source: classId,
                target: out.localDefs.get(base) ?? `external:${base}`,
                relation: 'extends',
                confidence: 'EXTRACTED',
                evidence: `extends clause at ${relPath}:${loc(clause)}`,
              });
              registerUnknownBase(ctx, base);
            }
          } else if (clause.type === 'implements_clause') {
            for (const iface of clause.namedChildren) {
              if (!iface?.text) continue;
              out.addEdge({
                source: classId,
                target: out.localDefs.get(iface.text) ?? `external:${iface.text}`,
                relation: 'implements',
                confidence: 'EXTRACTED',
                evidence: `implements clause at ${relPath}:${loc(clause)}`,
              });
              registerUnknownBase(ctx, iface.text);
            }
          }
        }
        break;
      }
      case 'call_expression': {
        const fn = field(node, 'function');
        if (!fn) break;

        // CommonJS `require('x')` and dynamic `import('x')` are imports, not
        // calls. Without this, a CJS-heavy tree (TNF's scripts/ is 527 files of
        // it) produces no import edges at all, which in turn disables the
        // import-narrowing rule that keeps cross-file call resolution precise.
        const moduleSpecifier = requireSpecifier(fn, node);
        if (moduleSpecifier !== undefined) {
          out.addImport(moduleSpecifier, node);
          break;
        }

        const viaMember = fn.type === 'member_expression';
        const callee =
          fn.type === 'identifier'
            ? fn.text
            : viaMember
              ? field(fn, 'property')?.text
              : undefined;
        if (!callee) break;
        // `this.x()` names a method of the enclosing class, so it is not treated
        // as an opaque member call; anything else is.
        const onThis = viaMember && field(fn, 'object')?.type === 'this';
        out.addCall(callerId(ctx, node), callee, node, viaMember && !onThis);
        break;
      }
      default:
        break;
    }
  }
}

/**
 * Module specifier for `require('x')` / `import('x')`, or undefined when this
 * call is not a module load. Only a literal string counts: `require(someVar)`
 * names no specific module, and guessing one would be an invented edge.
 */
function requireSpecifier(fn: TSNode, call: TSNode): string | undefined {
  const isRequire = fn.type === 'identifier' && fn.text === 'require';
  const isDynamicImport = fn.type === 'import';
  if (!isRequire && !isDynamicImport) return undefined;
  const args = field(call, 'arguments');
  const first = args?.namedChildren.find((c) => c?.type === 'string');
  if (!first) return undefined;
  return unquote(first.text);
}

/** A base type that is not defined in this file becomes an `external` node. */
function registerUnknownBase(ctx: ExtractorContext, name: string): void {
  if (ctx.out.localDefs.has(name)) return;
  ctx.out.addNode({
    id: `external:${name}`,
    label: name,
    kind: 'external',
    sourceFile: '',
    meta: { unresolvedType: true },
  });
}

/** Node id of the function/method containing a call, falling back to the file. */
function callerId(ctx: ExtractorContext, node: TSNode): string {
  const scope = enclosing(node, CALL_SCOPES);
  if (!scope) return ctx.relPath;
  const name = fieldText(scope, 'name');
  if (!name) return ctx.relPath;
  if (scope.type === 'method_definition') {
    const owner = enclosing(scope, ['class_declaration', 'abstract_class_declaration']);
    const ownerName = owner ? fieldText(owner, 'name') : undefined;
    return symbolId(ctx.relPath, ownerName ? `${ownerName}.${name}` : name);
  }
  return symbolId(ctx.relPath, name);
}
