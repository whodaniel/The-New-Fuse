/**
 * Monterey (Safari 15 / bundled WKWebView) rejects RegExp lookbehind:
 *   SyntaxError: Invalid regular expression: invalid group specifier name
 *
 * That throws while evaluating the vendor chunk, so React never mounts and
 * the HTML splash spinner stays forever.
 *
 * mdast-util-gfm-autolink-literal ships one email autolink pattern with
 * lookbehind. Its findEmail() already re-checks the prior character via
 * previous(match, true), so stripping the lookbehind keeps behavior intact
 * on older WebKit.
 */
const EMAIL_LOOKBEHIND =
  '/(?<=^|\\s|\\p{P}|\\p{S})([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)/gu';
const EMAIL_SAFE = '/([-\\.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)/gu';

export function safariMontereyCompatPlugin() {
  return {
    name: 'tnf-safari-monterey-compat',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('mdast-util-gfm-autolink-literal')) return null;
      if (!code.includes('(?<=^')) return null;
      return {
        code: code.split(EMAIL_LOOKBEHIND).join(EMAIL_SAFE),
        map: null,
      };
    },
    // Safety net if a minified copy slips past transform (prebundled / cached).
    renderChunk(code: string) {
      if (!code.includes('(?<=^|\\s|\\p{P}|\\p{S})')) return null;
      return {
        code: code.split(EMAIL_LOOKBEHIND).join(EMAIL_SAFE),
        map: null,
      };
    },
  };
}
