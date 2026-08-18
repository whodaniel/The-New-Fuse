import { simpleChatBridge } from '../SimpleChatBridge';

/**
 * Regression tests for the claude.ai failure:
 *
 *   [SimpleChatBridge] Chat input did not accept injected text;
 *   observed="[Sender: BROWSER-... (@ID#:2q2tPh)][Channel: global] Testing human typing..."
 *
 * Every injected message carries a `[Sender: ...][Channel: ...]\n` header.
 * Rich editors do not preserve that newline in textContent — ProseMirror
 * (claude.ai) splits it into sibling blocks that concatenate with no separator,
 * others substitute a space or NBSP. The verification compared raw strings, so
 * it declared failure for text that was demonstrably in the composer and
 * aborted the send.
 */

// The verification helpers are private; exercise them through the instance.
const bridge = simpleChatBridge as unknown as {
  normalizeForComparison(text: string): string;
  inputContainsText(input: HTMLElement, text: string): boolean;
  getInputText(input: HTMLElement): string;
};

const HEADER = '[Sender: BROWSER-1786903429626-7XZ0Q2WO6 (@ID#:2q2tPh)][Channel: global]';
const BODY = 'Testing human typing into the Fuse Connect injectable chat UI.';
const INJECTED = `${HEADER}\n${BODY}`;

describe('injected text verification across editor whitespace handling', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('drops whitespace entirely so all editor variants converge', () => {
    // A newline that becomes nothing, a space, or an NBSP must all compare equal.
    expect(bridge.normalizeForComparison('a\nb')).toBe('ab');
    expect(bridge.normalizeForComparison('ab')).toBe('ab');
    expect(bridge.normalizeForComparison('a b')).toBe('ab');
    expect(bridge.normalizeForComparison('a  \n\t b')).toBe('ab');
    expect(bridge.normalizeForComparison('a b')).toBe('ab');
    expect(bridge.normalizeForComparison('  padded  ')).toBe('padded');
    expect(bridge.normalizeForComparison('')).toBe('');
  });

  it('accepts a ProseMirror composer that dropped the newline entirely', () => {
    // claude.ai: two sibling <p> blocks, textContent joins with no separator.
    document.body.innerHTML =
      `<div id="composer" contenteditable="true" role="textbox">` +
      `<p>${HEADER}</p><p>${BODY}</p></div>`;
    const composer = document.getElementById('composer') as HTMLElement;

    // This is the crux: the newline is simply gone from textContent.
    expect(composer.textContent).toBe(`${HEADER}${BODY}`);
    expect(bridge.inputContainsText(composer, INJECTED)).toBe(true);
  });

  it('accepts a composer that replaced the newline with a space', () => {
    document.body.innerHTML = `
      <div id="composer" contenteditable="true" role="textbox">${HEADER} ${BODY}</div>`;
    const composer = document.getElementById('composer') as HTMLElement;

    expect(bridge.inputContainsText(composer, INJECTED)).toBe(true);
  });

  it('accepts a composer that used a non-breaking space', () => {
    document.body.innerHTML = `
      <div id="composer" contenteditable="true" role="textbox">${HEADER} ${BODY}</div>`;
    const composer = document.getElementById('composer') as HTMLElement;

    expect(bridge.inputContainsText(composer, INJECTED)).toBe(true);
  });

  it('still accepts a plain textarea that preserved the newline exactly', () => {
    document.body.innerHTML = '<textarea id="composer"></textarea>';
    const composer = document.getElementById('composer') as HTMLTextAreaElement;
    composer.value = INJECTED;

    expect(bridge.inputContainsText(composer, INJECTED)).toBe(true);
  });

  it('still rejects a composer holding different text', () => {
    document.body.innerHTML = `
      <div id="composer" contenteditable="true" role="textbox">something else entirely</div>`;
    const composer = document.getElementById('composer') as HTMLElement;

    expect(bridge.inputContainsText(composer, INJECTED)).toBe(false);
  });

  it('rejects a composer holding only part of the message', () => {
    document.body.innerHTML = `
      <div id="composer" contenteditable="true" role="textbox">${HEADER}</div>`;
    const composer = document.getElementById('composer') as HTMLElement;

    expect(bridge.inputContainsText(composer, INJECTED)).toBe(false);
  });

  it('rejects an empty composer', () => {
    document.body.innerHTML = '<div id="composer" contenteditable="true"></div>';
    const composer = document.getElementById('composer') as HTMLElement;

    expect(bridge.inputContainsText(composer, INJECTED)).toBe(false);
  });
});
