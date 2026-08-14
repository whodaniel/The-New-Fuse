import { simpleChatBridge } from '../SimpleChatBridge';

describe('SimpleChatBridge injection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    simpleChatBridge.destroy();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    simpleChatBridge.destroy();
  });

  it('injects text into a textarea and submits through the send button', async () => {
    jest.setTimeout(10000);
    document.body.innerHTML = `
      <main>
        <form>
          <textarea placeholder="Message"></textarea>
          <button type="button" aria-label="Send message">Send</button>
        </form>
      </main>
    `;

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    const send = document.querySelector('button') as HTMLButtonElement;
    send.addEventListener('click', () => {
      textarea.value = '';
    });

    const success = await simpleChatBridge.sendMessage('hello from fuse');

    expect(success).toBe(true);
    expect(simpleChatBridge.getLastSendResult()).toMatchObject({
      success: true,
      injected: true,
      submitted: true,
      method: 'button-click',
    });
  });

  it('injects text into a contenteditable chat composer before submitting', async () => {
    jest.setTimeout(10000);
    document.body.innerHTML = `
      <main>
        <div role="textbox" contenteditable="true" aria-label="Message"></div>
        <button type="button" aria-label="Send">Send</button>
      </main>
    `;

    const input = document.querySelector('[contenteditable="true"]') as HTMLElement;
    const send = document.querySelector('button') as HTMLButtonElement;
    send.addEventListener('click', () => {
      input.textContent = '';
    });

    const success = await simpleChatBridge.sendMessage('contenteditable payload');

    expect(success).toBe(true);
    expect(simpleChatBridge.getLastSendResult()).toMatchObject({
      success: true,
      injected: true,
      submitted: true,
      method: 'button-click',
    });
  });

  it('resolves Gemini placeholder children to the actual editable composer', async () => {
    jest.setTimeout(10000);
    document.body.innerHTML = `
      <main>
        <rich-textarea>
          <div class="ql-editor textarea" contenteditable="true" aria-label="Enter a prompt">
            <p data-placeholder="Ask Gemini"></p>
          </div>
        </rich-textarea>
        <button type="button" aria-label="Send message">Send</button>
      </main>
    `;

    const editor = document.querySelector('.ql-editor') as HTMLElement;
    const placeholder = document.querySelector('p[data-placeholder]') as HTMLElement;
    const send = document.querySelector('button') as HTMLButtonElement;
    send.addEventListener('click', () => {
      editor.textContent = '';
    });

    const elements = simpleChatBridge.findElements();
    expect(elements.input).toBe(editor);
    expect(elements.input).not.toBe(placeholder);

    const success = await simpleChatBridge.sendMessage('gemini page payload');

    expect(success).toBe(true);
    expect((placeholder as any).value).toBeUndefined();
    expect(simpleChatBridge.getLastSendResult()).toMatchObject({
      success: true,
      injected: true,
      submitted: true,
    });
  });

  it('injects into Kimi ProseMirror-style contenteditable composers', async () => {
    jest.setTimeout(10000);
    document.body.innerHTML = `
      <main>
        <div class="kimi-chat-input">
          <div class="ProseMirror" contenteditable="true" role="textbox"></div>
        </div>
        <button type="button" aria-label="Send">Send</button>
      </main>
    `;

    const editor = document.querySelector('.ProseMirror') as HTMLElement;
    const send = document.querySelector('button') as HTMLButtonElement;
    send.addEventListener('click', () => {
      editor.textContent = '';
    });

    const success = await simpleChatBridge.sendMessage('kimi page payload');

    expect(success).toBe(true);
    expect(simpleChatBridge.getLastSendResult()).toMatchObject({
      success: true,
      injected: true,
      submitted: true,
    });
  });

  it('does not use the Fuse Connect panel textarea as the page chat target', async () => {
    document.body.innerHTML = `
      <div id="fuse-connect-panel-v7">
        <textarea class="fcp6-input" data-input="message" placeholder="Message the channel..."></textarea>
        <button type="button" aria-label="Send">Panel Send</button>
      </div>
      <main>
        <textarea placeholder="Message"></textarea>
        <button type="button" aria-label="Send message">Page Send</button>
      </main>
    `;

    const pageTextarea = document.querySelector('main textarea') as HTMLTextAreaElement;
    const elements = simpleChatBridge.findElements();

    expect(elements.input).toBe(pageTextarea);
  });

  it('does not steal focus from the injectable composer when injecting a heartbeat', async () => {
    jest.setTimeout(10000);
    document.body.innerHTML = `
      <div id="fuse-connect-panel-v7">
        <textarea class="fcp6-input" data-input="message" placeholder="Message the channel..."></textarea>
      </div>
      <main>
        <textarea placeholder="Message"></textarea>
        <button type="button" aria-label="Send message">Send</button>
      </main>
    `;

    const panel = document.querySelector('.fcp6-input') as HTMLTextAreaElement;
    const page = document.querySelector('main textarea') as HTMLTextAreaElement;
    const send = document.querySelector('main button') as HTMLButtonElement;
    send.addEventListener('click', () => {
      page.value = '';
    });

    panel.value = 'hello I am typ';
    panel.focus();
    panel.setSelectionRange(14, 14);

    const success = await simpleChatBridge.sendMessage('TNF heartbeat from page-agent', {
      preserveUserFocus: true,
    });

    expect(success).toBe(true);
    expect(document.activeElement).toBe(panel);
    expect(panel.value).toBe('hello I am typ');
    expect(panel.selectionStart).toBe(14);
    expect(panel.selectionEnd).toBe(14);
  });

  it('keeps the injectable caret in place when the user keeps typing during injection', async () => {
    jest.setTimeout(10000);
    document.body.innerHTML = `
      <div id="fuse-connect-panel-v7">
        <textarea class="fcp6-input" data-input="message" placeholder="Message the channel..."></textarea>
      </div>
      <main>
        <textarea placeholder="Message"></textarea>
        <button type="button" aria-label="Send message">Send</button>
      </main>
    `;

    const panel = document.querySelector('.fcp6-input') as HTMLTextAreaElement;
    const page = document.querySelector('main textarea') as HTMLTextAreaElement;
    const send = document.querySelector('main button') as HTMLButtonElement;
    send.addEventListener('click', () => {
      page.value = '';
    });

    panel.value = 'hello I am typ';
    panel.focus();
    panel.setSelectionRange(14, 14);

    const sendPromise = simpleChatBridge.sendMessage('TNF heartbeat from page-agent');
    panel.value = 'hello I am typing a full sentence';
    panel.setSelectionRange(panel.value.length, panel.value.length);

    const success = await sendPromise;

    expect(success).toBe(true);
    expect(document.activeElement).toBe(panel);
    expect(panel.value).toBe('hello I am typing a full sentence');
    expect(panel.selectionStart).toBe(panel.value.length);
  });
});
