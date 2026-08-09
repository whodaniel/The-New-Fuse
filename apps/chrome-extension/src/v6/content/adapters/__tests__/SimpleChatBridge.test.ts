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
});
