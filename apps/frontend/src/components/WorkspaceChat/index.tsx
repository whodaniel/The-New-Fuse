// @ts-nocheck
import Workspace from '@/models/workspace';
import paths from '@/utils/paths';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ModalWrapper } from '../ModalWrapper';
import ChatContainer from './ChatContainer';
import LoadingChat from './LoadingChat';
// import { DnDFileUploaderProvider } from './ChatContainer/DnnDWrapper';
import { WorkspaceData } from '@/types/workspace';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  metadata?: Record<string, any>;
}

interface WorkspaceChatProps {
  loading: boolean;
  workspace: WorkspaceData | null;
}

// Enables us to safely markdown and sanitize all responses without risk of injection
// but still be able to attach a handler to copy code snippets on all elements
// that are code snippets.
function copyCodeSnippet(uuid: string): boolean {
  const target = document.querySelector(`[data-code="${uuid}"]`);
  if (!target) return false;
  const markdown =
    target.parentElement?.parentElement?.querySelector('pre:first-of-type')?.innerText;
  if (!markdown) return false;

  window.navigator.clipboard.writeText(markdown);
  target.classList.add('text-green-500');
  const originalText = target.innerHTML;
  target.innerText = 'Copied!';
  target.setAttribute('disabled', 'true');

  setTimeout(() => {
    target.classList.remove('text-green-500');
    target.innerHTML = originalText;
    target.removeAttribute('disabled');
  }, 2500);

  return true;
}

// Event handler for code snippet clicks (singleton pattern)
let codeSnippetHandler: ((e: MouseEvent) => void) | null = null;

// Sets up event delegation for code snippet copying
function setupEventDelegatorForCodeSnippets(): () => void {
  if (codeSnippetHandler) {
    return () => {}; // Already set up
  }

  codeSnippetHandler = function (e: MouseEvent) {
    const target = (e.target as Element).closest('[data-code-snippet]');
    const uuidCode = target?.getAttribute('data-code');
    if (!uuidCode) return;
    copyCodeSnippet(uuidCode);
  };

  document.addEventListener('click', codeSnippetHandler);

  // Return cleanup function
  return () => {
    if (codeSnippetHandler) {
      document.removeEventListener('click', codeSnippetHandler);
      codeSnippetHandler = null;
    }
  };
}

export default function WorkspaceChat({ loading, workspace }: WorkspaceChatProps): JSX.Element {
  const { threadSlug = null } = useParams<{ threadSlug?: string }>();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  useEffect(() => {
    async function getHistory() {
      if (loading) return;
      if (!workspace?.slug) {
        setLoadingHistory(false);
        return false;
      }

      const chatHistory = threadSlug
        ? await Workspace.threads.chatHistory(workspace.slug, threadSlug)
        : await Workspace.chatHistory(workspace.slug);

      setHistory(chatHistory);
      setLoadingHistory(false);
    }
    getHistory();
  }, [workspace, loading, threadSlug]);

  // FIX: Move event listener setup to useEffect with cleanup
  useEffect(() => {
    const cleanup = setupEventDelegatorForCodeSnippets();
    return cleanup;
  }, []);

  if (loadingHistory) return <LoadingChat />;
  if (!loading && !loadingHistory && !workspace) {
    return (
      <>
        {loading === false && !workspace && (
          <ModalWrapper isOpen={true}>
            <div className="relative w-full max-w-2xl bg-theme-bg-secondary rounded-md shadow border-2 border-theme-modal-border">
              <div className="flex flex-col gap-y-4 w-full p-4 text-center">
                <p className="font-semibold text-red-500 text-xl">Workspace not found!</p>
                <p className="text-sm mt-4 text-white">
                  It looks like a workspace by this name is not available.
                </p>

                <div className="flex w-full justify-center items-center mt-4">
                  <a
                    href={paths.home()}
                    className="transition-all duration-300 bg-transparent text-black hover:opacity-60 px-4 py-2 rounded-md text-sm flex items-center gap-x-2"
                  >
                    Go back to homepage
                  </a>
                </div>
              </div>
            </div>
          </ModalWrapper>
        )}
        <LoadingChat />
      </>
    );
  }

  return <ChatContainer workspace={workspace} knownHistory={history} />;
}
