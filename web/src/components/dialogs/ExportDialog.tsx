'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, FileType } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'pdf' | 'txt') => void;
  projectTitle: string;
}

export function ExportDialog({ open, onOpenChange, onExport, projectTitle }: ExportDialogProps) {
  const handleExport = (format: 'pdf' | 'txt') => {
    onExport(format);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Choose the format to export "{projectTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={() => handleExport('pdf')}
            variant="outline"
            className="h-auto flex-col items-start p-4 hover:bg-accent"
          >
            <div className="flex items-center gap-2 w-full">
              <FileText className="h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-semibold">PDF Document</div>
                <div className="text-sm text-muted-foreground">
                  Export as a printable PDF file (opens print dialog)
                </div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleExport('txt')}
            variant="outline"
            className="h-auto flex-col items-start p-4 hover:bg-accent"
          >
            <div className="flex items-center gap-2 w-full">
              <FileType className="h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-semibold">Text File</div>
                <div className="text-sm text-muted-foreground">
                  Export as a plain text (.txt) file
                </div>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
