// @ts-nocheck
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Link, Upload } from '@phosphor-icons/react';
import React, { useState } from 'react';

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

export default function ManageWorkspace({ hideModal }: ManageWorkspaceProps) {
  return (
    <Dialog open={true} onOpenChange={hideModal}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Workspace Documents</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="mr-2 h-4 w-4" />
              Add Link
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="mr-2 h-4 w-4" />
              Add Text
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <div className="space-y-4 p-4">
              <div className="flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                <div className="text-center">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 text-muted-foreground">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground/80">
                    Supports PDF, DOC, TXT, and other text formats
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    className="hidden"
                    id="file-upload"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      // Handle file upload
                      console.log('Files selected:', e.target.files);
                    }}
                  />
                  <Button className="mt-4">
                    <label htmlFor="file-upload">Select Files</label>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="link">
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium">URL</label>
                <Input type="url" placeholder="https://example.com" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Title (optional)</label>
                <Input type="text" placeholder="Document title" />
              </div>
              <Button>Add Link</Button>
            </div>
          </TabsContent>
          <TabsContent value="text">
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Title</label>
                <Input type="text" placeholder="Document title" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Content</label>
                <Textarea
                  rows={10}
                  placeholder="Enter your text content here..."
                  className="resize-none"
                />
              </div>
              <Button>Add Text</Button>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={hideModal}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
