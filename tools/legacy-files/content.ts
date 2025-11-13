// ...existing code...

  if (!content || content === monitoring.lastProcessedContent as any) {
    return;
  }

  monitoring.lastProcessedContent = content as any;

  port.postMessage({
    type: 'chatContentExtracted',
    content: content,
    source: window.location.href,
    conversation: conversation as ExtractedChatMessage[]
  } as unknown as ImportedRuntimeMessage); // Cast to unknown first then to ImportedRuntimeMessage

  switch (message.type) {
    // Remove unused ts-expect-error directive

    case 'sendChat' as RuntimeMessageType: {
      // ...existing code...
    }
  }

                    port.postMessage({
                        type: 'codeBlockClicked',
                        code: block.textContent || '',
                        language: block.className.match(/language-(\w+)/)?.[1] || ''
                    } as unknown as ImportedRuntimeMessage); // Cast to unknown first

// ...existing code...