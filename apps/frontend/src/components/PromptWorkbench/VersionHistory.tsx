// @ts-nocheck
import { Badge, Button, LoadingSpinner } from '@/components/ui';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { PromptTemplateVersion, usePromptTemplates } from '../../hooks/usePromptTemplates';

interface VersionHistoryProps {
  templateId: string | null;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ templateId }) => {
  const { getTemplateVersions, loadTemplate } = usePromptTemplates();
  const [versions, setVersions] = useState<PromptTemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PromptTemplateVersion | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (templateId) {
      loadVersions();
    } else {
      setVersions([]);
    }
  }, [templateId]);

  const loadVersions = async () => {
    if (!templateId) return;

    setLoading(true);
    try {
      const versionHistory = await getTemplateVersions(templateId);
      setVersions(versionHistory);
    } catch (error: any) {
      toast({
        title: 'Error loading version history',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version: PromptTemplateVersion) => {
    setSelectedVersion(version);
    setIsOpen(true);
  };

  const handleRestoreVersion = async (version: PromptTemplateVersion) => {
    if (!templateId) return;

    try {
      await loadTemplate(templateId);

      toast({
        title: 'Version restored',
        description: `Restored to version from ${format(new Date(version.createdAt), 'PPpp')}`,
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error restoring version',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!templateId) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Please select a template to view version history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Version History</h3>
        <Button size="sm" variant="outline" onClick={loadVersions}>
          Refresh
        </Button>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-md">
          <p className="text-muted-foreground">No version history available.</p>
          <p className="text-sm text-neutral-400 mt-2">
            Version history will be created when you update this template.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-transparent dark:bg-transparent rounded-md shadow-none">
          <table className="min-w-full divide-y divide-border/50 dark:divide-border/40">
            <thead className="bg-transparent dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                  Version
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                  Created
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                  By
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                  Comment
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent dark:bg-transparent divide-y divide-border/50 dark:divide-border/40">
              {versions.map((version, index) => (
                <tr key={version.id} className="hover:bg-transparent dark:hover:bg-muted/20">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {index === 0 ? (
                      <Badge variant="success">Latest</Badge>
                    ) : (
                      <span className="text-sm">v{versions.length - index}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{version.createdBy}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="max-w-xs truncate">
                      {version.comment || (
                        <span className="italic text-muted-foreground">No comment</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleViewVersion(version)}
                      >
                        View
                      </Button>
                      {index > 0 && (
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => handleRestoreVersion(version)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Version Detail Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Version from{' '}
            {selectedVersion ? format(new Date(selectedVersion.createdAt), 'PPpp') : ''}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedVersion && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-bold mb-1">Comment:</p>
                  <p>{selectedVersion.comment || 'No comment'}</p>
                </div>
                <hr className="border-neutral-200 dark:border-neutral-700" />
                <div>
                  <p className="font-bold mb-2">Template Content:</p>
                  <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-md font-mono text-sm whitespace-pre-wrap bg-transparent dark:bg-neutral-900 max-h-[300px] overflow-y-auto">
                    {selectedVersion.content}
                  </div>
                </div>
                <div>
                  <p className="font-bold mb-2">Variables:</p>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Default Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedVersion.variables).map(([key, value]) => (
                        <tr
                          key={key}
                          className="border-b border-neutral-200 dark:border-neutral-700"
                        >
                          <td className="py-2">{key}</td>
                          <td className="py-2">{value}</td>
                        </tr>
                      ))}
                      {Object.keys(selectedVersion.variables).length === 0 && (
                        <tr>
                          <td colSpan={2} className="text-center py-2 text-muted-foreground">
                            No variables defined
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="mr-3">
              Close
            </Button>
            {selectedVersion && (
              <Button variant="primary" onClick={() => handleRestoreVersion(selectedVersion)}>
                Restore This Version
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
