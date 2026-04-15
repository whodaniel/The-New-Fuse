const XMLHttpRequestRef =
  typeof globalThis !== 'undefined' && 'XMLHttpRequest' in globalThis
    ? (globalThis.XMLHttpRequest as typeof XMLHttpRequest)
    : (class MissingXMLHttpRequest {
        constructor() {
          throw new Error('XMLHttpRequest is unavailable in this runtime.');
        }
      } as unknown as typeof XMLHttpRequest);

export { XMLHttpRequestRef as XMLHttpRequest };
export default { XMLHttpRequest: XMLHttpRequestRef };
