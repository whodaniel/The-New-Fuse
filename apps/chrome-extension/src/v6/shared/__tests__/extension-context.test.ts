import {
  isExtensionContextInvalidated,
  isTransientRuntimeDisconnect,
  runtimeErrorMessage,
} from '../extension-context';

describe('extension runtime error classification', () => {
  it('extracts messages from Error objects and lastError-shaped values', () => {
    expect(runtimeErrorMessage(new Error('Extension context invalidated.'))).toBe(
      'Extension context invalidated.'
    );
    expect(runtimeErrorMessage({ message: 'Receiving end does not exist' })).toBe(
      'Receiving end does not exist'
    );
    expect(runtimeErrorMessage('plain')).toBe('plain');
  });

  it('treats only a dead extension context as fatal', () => {
    expect(isExtensionContextInvalidated('Error: Extension context invalidated.')).toBe(true);
    expect(isExtensionContextInvalidated('Could not establish connection. Receiving end does not exist.')).toBe(
      false
    );
  });

  it('treats MV3 listener misses and closed ports as transient', () => {
    expect(
      isTransientRuntimeDisconnect('Could not establish connection. Receiving end does not exist.')
    ).toBe(true);
    expect(
      isTransientRuntimeDisconnect('The message port closed before a response was received.')
    ).toBe(true);
    expect(isTransientRuntimeDisconnect('Extension context invalidated.')).toBe(false);
  });
});
