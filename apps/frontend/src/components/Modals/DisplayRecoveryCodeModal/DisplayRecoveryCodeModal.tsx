import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import showToast from '@/utils/toast';
import { DownloadSimple, Key } from '@phosphor-icons/react';
import { saveAs } from 'file-saver';
import { useState } from 'react';

interface RecoveryCodeModalProps {
  recoveryCodes: string[];
  onDownloadComplete: () => void;
  onClose: () => void;
}

export function RecoveryCodeModal({
  recoveryCodes,
  onDownloadComplete,
  onClose,
}: RecoveryCodeModalProps) {
  const [downloadClicked, setDownloadClicked] = useState(false);

  const downloadRecoveryCodes = () => {
    const blob = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' });
    saveAs(blob, 'recovery_codes.txt');
    setDownloadClicked(true);
  };

  const handleClose = () => {
    if (downloadClicked) {
      onDownloadComplete();
      onClose();
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join(',\n'));
      showToast('Recovery codes copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy recovery codes', 'error');
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-x-2">
            <Key size={24} weight="bold" />
            Recovery Codes
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            In order to reset your password in the future, you will need these recovery codes.
            Download or copy your recovery codes to save them. <br />
            <b className="mt-4">These recovery codes are only shown once!</b>
          </p>
          <div
            className="cursor-pointer rounded-md border bg-muted p-4 hover:bg-muted/80"
            onClick={handleCopyToClipboard}
          >
            <ul className="space-y-2">
              {recoveryCodes.map((code, index) => (
                <li key={index} className="text-sm font-mono">
                  {code}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={downloadClicked ? handleClose : downloadRecoveryCodes}>
            {downloadClicked ? (
              'Close'
            ) : (
              <>
                <DownloadSimple weight="bold" size={18} className="mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
