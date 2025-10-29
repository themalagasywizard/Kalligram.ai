'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { Chapter } from '@/types';
import { ChapterItem } from './ChapterItem';

interface ChapterSidebarProps {
  chapters: Chapter[];
  currentChapterId?: string;
  currentChapterContent?: string;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onRenameChapter: (chapterId: string, newTitle: string) => Promise<void>;
  onDeleteChapter: (chapterId: string) => Promise<void>;
  onReorderChapters: (updates: Array<{ id: string; order_index: number }>) => Promise<void>;
}

export function ChapterSidebar({
  chapters,
  currentChapterId,
  currentChapterContent = '',
  onSelectChapter,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onReorderChapters
}: ChapterSidebarProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const wordCount = useMemo(() => {
    const cleanText = currentChapterContent.replace(/<[^>]*>/g, '');
    const words = cleanText.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }, [currentChapterContent]);

  const percentage = useMemo(() => {
    const target = 1000;
    return Math.min(Math.round((wordCount / target) * 100), 100);
  }, [wordCount]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleDragStart = (chapterId: string) => {
    setDraggedId(chapterId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = chapters.findIndex(c => c.id === draggedId);
    const targetIndex = chapters.findIndex(c => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reorderedChapters = [...chapters];
    const [removed] = reorderedChapters.splice(draggedIndex, 1);
    reorderedChapters.splice(targetIndex, 0, removed);

    const updates = reorderedChapters.map((chapter, index) => ({
      id: chapter.id,
      order_index: index
    }));

    await onReorderChapters(updates);
    setDraggedId(null);
  };

  return (
    <div className="w-64 border-r bg-card flex flex-col h-full">
      {/* Header aligned with toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-2 px-4 py-2">
          <h3 className="font-semibold text-sm">Chapters</h3>
          <Button
            onClick={onAddChapter}
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="Add Chapter"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chapters.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No chapters yet
            </div>
          ) : (
            chapters.map((chapter) => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                isActive={chapter.id === currentChapterId}
                onSelect={onSelectChapter}
                onRename={onRenameChapter}
                onDelete={onDeleteChapter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                isDragging={draggedId === chapter.id}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Word Count Footer */}
      <div className="border-t bg-muted/50 px-6 py-3 min-h-[98px]">
        <div className="flex items-center justify-end gap-4 h-full">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16">
              <svg className="transform -rotate-90" width="64" height="64">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-primary transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">{percentage}%</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {wordCount.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                words / 1,000 target
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
