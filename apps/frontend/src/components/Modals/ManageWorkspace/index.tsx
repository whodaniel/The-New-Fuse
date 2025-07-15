import React, { useState } from 'react';
import { X, Upload, FileText, Link } from '@phosphor-icons/react';
import { ModalWrapper } from '@/components/ModalWrapper';

interface ManageWorkspaceProps {
  hideModal: () => void;
  providedSlug?: string;
}

interface ManageWorkspaceModalReturn {
  showing: boolean;
  showModal: () => void;
  hideModal: () => void;
}

export function useManageWorkspaceModal(): ManageWorkspaceModalReturn {
  const [showing, setShowing] = useState(false);

  const showModal = () => setShowing(true);
  const hideModal = () => setShowing(false);

  return {
    showing,
    showModal,
    hideModal,
  };
}

export default function ManageWorkspace({
  hideModal,
  providedSlug,
}: ManageWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'text'>('upload');

  const tabs = [
    { id: 'upload', label: 'Upload Files', icon: Upload },
    { id: 'link', label: 'Add Link', icon: Link },
    { id: 'text', label: 'Add Text', icon: FileText },
  ];

  return (
    <ModalWrapper isOpen={true}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-theme-bg-secondary rounded-lg shadow-xl border border-theme-modal-border w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-theme-modal-border">
            <h2 className="text-xl font-semibold text-white">
              Manage Workspace Documents
            </h2>
            <button
              onClick={hideModal}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-theme-modal-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-theme-modal-border rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-white/40 mb-4" />
                  <p className="text-white/60 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-white/40">
                    Supports PDF, DOC, TXT, and other text formats
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      // Handle file upload
                      console.log('Files selected:', e.target.files);
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                      input?.click();
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Select Files
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Document title"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Add Link
                </button>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Document title"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Content
                  </label>
                  <textarea
                    rows={10}
                    placeholder="Enter your text content here..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Add Text
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-theme-modal-border">
            <button
              onClick={hideModal}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}