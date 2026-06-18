import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200" />
        
        {/* Content wrapper */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content className="w-full max-w-md transform overflow-hidden rounded-lg bg-card text-foreground border border-border p-6 shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              {isDestructive && (
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              
              <div className="flex-1">
                <Dialog.Title className="text-lg font-semibold leading-6 text-foreground">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              </div>
              
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md text-muted-foreground hover:text-foreground hover:bg-muted p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                {cancelText}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
                  isDestructive
                    ? 'bg-rose-600 hover:bg-rose-750 focus:ring-rose-500'
                    : 'bg-primary hover:bg-primary/95 focus:ring-primary'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmDialog;
