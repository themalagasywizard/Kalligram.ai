'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (opts: { title: string; description?: string; page_size: 'A4' | 'A3'; orientation: 'portrait' | 'landscape' }) => void;
}

export function NewProjectDialog({ open, onOpenChange, onCreate }: NewProjectDialogProps) {
  const [title, setTitle] = useState('Untitled Project');
  const [description, setDescription] = useState('');
  const [pageSize, setPageSize] = useState<'A4' | 'A3'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const handleCreate = () => {
    onCreate({ title: title.trim() || 'Untitled Project', description: description.trim() || undefined, page_size: pageSize, orientation });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Choose document page size and orientation</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description (optional)</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Page size</Label>
              <div className="flex gap-2">
                <Button variant={pageSize==='A4'? 'default':'outline'} size="sm" onClick={()=>setPageSize('A4')}>A4</Button>
                <Button variant={pageSize==='A3'? 'default':'outline'} size="sm" onClick={()=>setPageSize('A3')}>A3</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Orientation</Label>
              <div className="flex gap-2">
                <Button variant={orientation==='portrait'? 'default':'outline'} size="sm" onClick={()=>setOrientation('portrait')}>Portrait</Button>
                <Button variant={orientation==='landscape'? 'default':'outline'} size="sm" onClick={()=>setOrientation('landscape')}>Landscape</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}