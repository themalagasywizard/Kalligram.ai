'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2 } from 'lucide-react';
import { Chapter } from '@/types';
import { cn } from '@/lib/utils';

interface ChapterItemProps {
  chapter: Chapter;
  isActive: boolean;
  onSelect: (chapterId: string) => void;
  onRename: (chapterId: string, newTitle: string) => Promise<void>;
  onDelete: (chapterId: string) => Promise<void>;
  onDragStart: (chapterId: string) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string) => void;
  isDragging: boolean;
}

export function ChapterItem({
  chapter,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging
}: ChapterItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chapter.title);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(chapter.title);
  };

  const handleRename = async () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== chapter.title) {
      await onRename(chapter.id, trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(chapter.title);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${chapter.title}"?`)) {
      await onDelete(chapter.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(chapter.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(chapter.id);
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={() => {
        onDragEnd();
        setIsDragOver(false);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isEditing && onSelect(chapter.id)}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer",
        "border-l-2 transition-all",
        isActive
          ? "bg-primary/10 border-primary text-primary font-medium"
          : "border-transparent hover:bg-accent hover:border-primary/50",
        isDragging && "opacity-50",
        isDragOver && "bg-primary/20 border-primary"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
      
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="flex-1 text-sm truncate">{chapter.title}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}
