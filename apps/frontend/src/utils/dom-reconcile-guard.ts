/**
 * Browser translation / extensions can wrap or move text nodes under React's
 * control. When React later commits a removeChild/insertBefore against stale
 * parent/child links, the browser throws NotFoundError and ErrorBoundaries
 * surface "Something went wrong".
 *
 * Patch once so reconcile stays resilient. Pattern mirrors Dan Abramov's
 * suggested Google Translate mitigation.
 */
export function installDomReconcileGuard(): void {
  if (typeof window === 'undefined' || typeof Node === 'undefined') return;
  if ((window as Window & { __TNF_DOM_RECONCILE_GUARD__?: boolean }).__TNF_DOM_RECONCILE_GUARD__) {
    return;
  }

  const isMissingChildError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;
    const name = String((error as { name?: string }).name || '');
    const message = String((error as { message?: string }).message || '').toLowerCase();
    return (
      name === 'NotFoundError' ||
      message.includes('not a child') ||
      message.includes('the node before which the new node is to be inserted is not a child')
    );
  };

  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;
  const originalAppendChild = Node.prototype.appendChild;

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    try {
      return originalRemoveChild.call(this, child) as T;
    } catch (error) {
      if (isMissingChildError(error)) {
        return child;
      }
      throw error;
    }
  };

  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalAppendChild.call(this, newNode) as T;
    }
    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (error) {
      if (isMissingChildError(error)) {
        return originalAppendChild.call(this, newNode) as T;
      }
      throw error;
    }
  };

  (window as Window & { __TNF_DOM_RECONCILE_GUARD__?: boolean }).__TNF_DOM_RECONCILE_GUARD__ =
    true;
}

export function isDomReconcileError(error: Error | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || error.toString?.() || '').toLowerCase();
  return (
    message.includes('removechild') ||
    message.includes('insertbefore') ||
    (error.name === 'NotFoundError' && message.includes('not a child'))
  );
}
