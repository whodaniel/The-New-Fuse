interface CopyOptions {
  stripMarkdown?: boolean;
  stripFormatting?: boolean;
  notification?: boolean;
}

export async function copyToClipboard(
  text: string,
  options: CopyOptions = {}
): Promise<boolean> {
  const { stripMarkdown = false, stripFormatting = false, notification = true } = options;

  try {
    let processedText = text;

    if (stripMarkdown) {
      processedText = processedText
        .replace(/[#*`_~\[\]]/g, '')
        .replace(/\n+/g, ' ')
        .trim();
    }

    if (stripFormatting) {
      processedText = processedText.replace(/\[.*?\]/g, '').trim();
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(processedText);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = processedText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    if (notification) {
      // You can implement your notification system here
      console.log('Copied to clipboard!');
    }

    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

export async function copyCodeBlock(codeBlock: string): Promise<boolean> {
  try {
    // Remove markdown code block syntax
    const code = codeBlock
      .replace(/^```[\w-]*\n/, '') // Remove opening ```lang
      .replace(/```$/, '') // Remove closing ```
      .trim();

    return await copyToClipboard(code, {
      stripMarkdown: false,
      stripFormatting: false,
      notification: true,
    });
  } catch (error) {
    console.error('Failed to copy code block:', error);
    return false;
  }
}

export async function shareMessage(message: string): Promise<boolean> {
  if (!navigator.share) {
    return copyToClipboard(message, {
      stripMarkdown: true,
      notification: true,
    });
  }

  try {
    await navigator.share({
      text: message,
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return false; // User cancelled sharing
    }
    // Fall back to copying if sharing fails
    return copyToClipboard(message, {
      stripMarkdown: true,
      notification: true,
    });
  }
}